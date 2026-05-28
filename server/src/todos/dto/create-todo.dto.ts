import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SubtaskDto {
  @IsString() text: string;
  @IsBoolean() completed: boolean;
}

export class CreateTodoDto {
  @IsString() text: string;

  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() starred?: boolean;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() dueTime?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsString() createdAt: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];
}
