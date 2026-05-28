import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      const username = process.env.AUTH_USERNAME || "admin";
      const password = process.env.AUTH_PASSWORD || "admin";
      const hash = await bcrypt.hash(password, 10);
      await this.prisma.user.create({
        data: { username, password: hash, createdAt: new Date().toISOString() },
      });
      this.logger.log(`Default user created: ${username}`);
    }
  }

  async validateUser(username: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }

  async login(username: string) {
    const payload = { sub: username };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(username: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) return null;
    const hash = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: { username, password: hash, createdAt: new Date().toISOString() },
    });
    return this.login(username);
  }

  async changePassword(username: string, oldPassword: string, newPassword: string) {
    const valid = await this.validateUser(username, oldPassword);
    if (!valid) return false;
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { username }, data: { password: hash } });
    return true;
  }
}
