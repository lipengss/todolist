import { IsInt, IsBoolean, IsOptional, Min, Max } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(120) reminderMinutes?: number;
  @IsOptional() @IsBoolean() repeatEnabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(60) repeatIntervalMinutes?: number;
}
