import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  }

  find() {
    return this.prisma.settings.findUnique({ where: { id: 1 } });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.settings.update({ where: { id: 1 }, data: dto });
  }
}
