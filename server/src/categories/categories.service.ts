import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ include: { todos: { select: { id: true } } } });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto, include: { todos: { select: { id: true } } } });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto, include: { todos: { select: { id: true } } } });
  }

  remove(id: string) {
    return this.prisma.$transaction([
      this.prisma.todo.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }
}
