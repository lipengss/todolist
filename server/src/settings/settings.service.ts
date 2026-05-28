import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.settings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      });
    } catch {
      this.logger.warn("Cannot upsert default settings — database not available");
    }
  }

  find() {
    return this.prisma.settings.findUnique({ where: { id: 1 } });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.settings.update({ where: { id: 1 }, data: dto });
  }
}
