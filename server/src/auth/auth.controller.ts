import { Controller, Post, Body, UnauthorizedException, BadRequestException, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.guard";
import { IsString, MinLength } from "class-validator";

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
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

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const valid = await this.authService.validateUser(dto.username, dto.password);
    if (!valid) {
      throw new UnauthorizedException("用户名或密码错误");
    }
    return this.authService.login(dto.username);
  }

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto.username, dto.password);
    if (!result) {
      throw new BadRequestException("用户名已存在");
    }
    return result;
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const ok = await this.authService.changePassword(req.user.username, dto.oldPassword, dto.newPassword);
    if (!ok) throw new BadRequestException("原密码错误");
    return { ok: true };
  }
}
