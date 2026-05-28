import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SubtaskDto {
  @IsOptional() @IsString() id?: string;
  @IsString() text: string;
  @IsBoolean() completed: boolean;
}

export class UpdateTodoDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() starred?: boolean;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() dueTime?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() completedAt?: string;
  @IsOptional() @IsString() deletedAt?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];
}
