import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.todo.findMany({ include: { subtasks: true, category: true } });
  }

  async create(dto: CreateTodoDto) {
    const { subtasks, categoryId, ...data } = dto;

    let resolvedCategoryId: string | undefined;
    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      resolvedCategoryId = category ? category.id : undefined;
    }

    return this.prisma.todo.create({
      data: {
        ...data,
        subtasks: subtasks ? { create: subtasks } : undefined,
        categoryId: resolvedCategoryId,
      },
      include: { subtasks: true, category: true },
    });
  }

  update(id: string, dto: UpdateTodoDto) {
    const { subtasks, ...data } = dto;
    const updateData: any = { ...data };

    if (subtasks) {
      updateData.subtasks = {
        deleteMany: {},
        create: subtasks.map((s) => ({ text: s.text, completed: s.completed })),
      };
    }

    return this.prisma.todo.update({
      where: { id },
      data: updateData,
      include: { subtasks: true, category: true },
    });
  }

  softDelete(id: string) {
    return this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
      include: { subtasks: true, category: true },
    });
  }

  remove(id: string) {
    return this.prisma.todo.delete({ where: { id } });
  }
}
