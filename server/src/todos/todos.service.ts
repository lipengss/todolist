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

    const todo = await this.prisma.todo.create({
      data: {
        ...data,
        subtasks: subtasks ? { create: subtasks } : undefined,
        categoryId: resolvedCategoryId,
      },
      include: { subtasks: true, category: true },
    });

    await this.recalcStorage();

    return todo;
  }

  async update(id: string, dto: UpdateTodoDto) {
    const { subtasks, ...data } = dto;
    const updateData: any = { ...data };

    if (subtasks) {
      updateData.subtasks = {
        deleteMany: {},
        create: subtasks.map((s) => ({ text: s.text, completed: s.completed })),
      };
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data: updateData,
      include: { subtasks: true, category: true },
    });

    await this.recalcStorage();

    return todo;
  }

  async softDelete(id: string) {
    const todo = await this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
      include: { subtasks: true, category: true },
    });

    await this.recalcStorage();

    return todo;
  }

  remove(id: string) {
    return this.prisma.todo.delete({ where: { id } });
  }

  private async recalcStorage() {
    const todoCount = await this.prisma.todo.count();
    const subtaskCount = await this.prisma.subtask.count();
    const totalItems = todoCount + subtaskCount;
    const estimatedBytes = totalItems * 2048;
    await this.prisma.user.updateMany({
      data: { storageUsed: estimatedBytes },
    });
  }
}
