import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(username: string, password: string): boolean {
    const envUser = process.env.AUTH_USERNAME || "admin";
    const envPass = process.env.AUTH_PASSWORD || "admin";
    return username === envUser && password === envPass;
  }

  login(username: string) {
    const payload = { sub: username };
    return { access_token: this.jwtService.sign(payload) };
  }
}
