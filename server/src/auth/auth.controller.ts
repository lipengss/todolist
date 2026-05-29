import { Controller, Post, Get, Delete, Body, Param, UnauthorizedException, BadRequestException, UseGuards, Request, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.guard";
import { IsString, MinLength } from "class-validator";
import { Request as ExpressRequest } from "express";

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() captchaToken: string;
}

class RegisterDto {
  @IsString() @MinLength(2) username: string;
  @IsString() @MinLength(3) password: string;
}

class ChangePasswordDto {
  @IsString() oldPassword: string;
  @IsString() @MinLength(3) newPassword: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("captcha")
  getCaptcha() {
    return this.authService.generateCaptcha();
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    // Validate captcha first
    const captchaValid = this.authService.validateCaptcha(dto.captchaToken);
    if (!captchaValid) {
      throw new BadRequestException("验证码错误或已过期");
    }

    const { valid, role } = await this.authService.validateUser(dto.username, dto.password);
    if (!valid) {
      throw new UnauthorizedException("用户名或密码错误");
    }
    const pendingReq = await this.authService.getRegistrations();
    const myReq = pendingReq.find(r => r.username === dto.username && r.status === "pending");
    if (myReq) {
      throw new UnauthorizedException("注册申请审批中，请等待管理员通过");
    }
    return this.authService.login(dto.username);
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: ExpressRequest) {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || "unknown";
    const result = await this.authService.submitRegistration(dto.username, dto.password, ip);
    if (!result) {
      throw new BadRequestException("用户名已存在");
    }
    if ("duplicate" in result) {
      throw new BadRequestException("你已提交过申请，请等待审批");
    }
    return { message: "申请已提交，等待管理员审批" };
  }

  @Get("registrations")
  @UseGuards(JwtAuthGuard)
  async getRegistrations(@Request() req: any) {
    if (req.user.role !== "admin") throw new UnauthorizedException("仅管理员可查看");
    return this.authService.getRegistrations();
  }

  @Post("registrations/:id/approve")
  @UseGuards(JwtAuthGuard)
  async approve(@Request() req: any, @Param("id") id: string) {
    if (req.user.role !== "admin") throw new UnauthorizedException("仅管理员可操作");
    const ok = await this.authService.approveRegistration(id);
    if (!ok) throw new BadRequestException("申请不存在或已处理");
    return { ok: true };
  }

  @Post("registrations/:id/reject")
  @UseGuards(JwtAuthGuard)
  async reject(@Request() req: any, @Param("id") id: string) {
    if (req.user.role !== "admin") throw new UnauthorizedException("仅管理员可操作");
    const ok = await this.authService.rejectRegistration(id);
    if (!ok) throw new BadRequestException("申请不存在或已处理");
    return { ok: true };
  }

  @Delete("registrations/:id")
  @UseGuards(JwtAuthGuard)
  async deleteRegistration(@Request() req: any, @Param("id") id: string) {
    if (req.user.role !== "admin") throw new UnauthorizedException("仅管理员可操作");
    await this.authService.deleteRegistration(id);
    return { ok: true };
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const ok = await this.authService.changePassword(req.user.username, dto.oldPassword, dto.newPassword);
    if (!ok) throw new BadRequestException("原密码错误");
    return { ok: true };
  }
}
