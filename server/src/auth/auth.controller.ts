import { Controller, Post, Body, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IsString } from "class-validator";

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    if (!this.authService.validateUser(dto.username, dto.password)) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(dto.username);
  }
}
