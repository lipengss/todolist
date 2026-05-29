import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private captchaStore = new Map<string, { createdAt: number }>();

  generateCaptcha(): { token: string } {
    const now = Date.now();
    for (const [key, entry] of this.captchaStore) {
      if (now - entry.createdAt > 5 * 60 * 1000) this.captchaStore.delete(key);
    }
    const token = randomUUID();
    this.captchaStore.set(token, { createdAt: now });
    return { token };
  }

  validateCaptcha(token: string): boolean {
    const entry = this.captchaStore.get(token);
    if (!entry) return false;
    const elapsed = Date.now() - entry.createdAt;
    if (elapsed < 800 || elapsed > 5 * 60 * 1000) {
      this.captchaStore.delete(token);
      return false;
    }
    this.captchaStore.delete(token);
    return true;
  }

  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      const username = process.env.AUTH_USERNAME || "admin";
      const password = process.env.AUTH_PASSWORD || "admin";
      const hash = await bcrypt.hash(password, 10);
      await this.prisma.user.create({
        data: { username, password: hash, role: "admin", createdAt: new Date().toISOString() },
      });
      this.logger.log(`Default admin created: ${username}`);
    }
  }

  async validateUser(username: string, password: string): Promise<{ valid: boolean; role?: string }> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return { valid: false };
    const ok = await bcrypt.compare(password, user.password);
    return { valid: ok, role: ok ? user.role : undefined };
  }

  async login(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    const payload = { sub: username, role: user?.role || "user" };
    return { access_token: this.jwtService.sign(payload) };
  }

  async submitRegistration(username: string, password: string, ip: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { username } });
    if (existingUser) return null;

    const existingReq = await this.prisma.registrationRequest.findFirst({
      where: { username, status: "pending" },
    });
    if (existingReq) return { duplicate: true };

    const hash = await bcrypt.hash(password, 10);
    await this.prisma.registrationRequest.create({
      data: { username, password: hash, ip, createdAt: new Date().toISOString() },
    });
    return { submitted: true };
  }

  async getRegistrations() {
    return this.prisma.registrationRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, status: true, ip: true, createdAt: true },
    });
  }

  async deleteRegistration(id: string) {
    await this.prisma.registrationRequest.delete({ where: { id } });
    return true;
  }

  async approveRegistration(id: string) {
    const req = await this.prisma.registrationRequest.findUnique({ where: { id } });
    if (!req || req.status !== "pending") return false;
    await this.prisma.user.create({
      data: { username: req.username, password: req.password, createdAt: new Date().toISOString() },
    });
    await this.prisma.registrationRequest.update({ where: { id }, data: { status: "approved" } });

    // Create default categories for new user
    const defaultCategories = [
      { name: "工作", color: "bg-chart-1" },
      { name: "学习", color: "bg-chart-2" },
      { name: "生活", color: "bg-chart-3" },
      { name: "健康", color: "bg-chart-4" },
    ];
    for (const cat of defaultCategories) {
      await this.prisma.category.create({
        data: { name: cat.name, color: cat.color },
      });
    }

    return true;
  }

  async rejectRegistration(id: string) {
    const req = await this.prisma.registrationRequest.findUnique({ where: { id } });
    if (!req || req.status !== "pending") return false;
    await this.prisma.registrationRequest.update({ where: { id }, data: { status: "rejected" } });
    return true;
  }

  async changePassword(username: string, oldPassword: string, newPassword: string) {
    const { valid } = await this.validateUser(username, oldPassword);
    if (!valid) return false;
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { username }, data: { password: hash } });
    return true;
  }
}
