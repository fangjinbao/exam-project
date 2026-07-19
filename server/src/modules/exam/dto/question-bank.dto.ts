import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 新增题库接口入参
 * 题库名称必填且全局唯一（2-50 字）；编码可选（≤30 字，留空由系统自动生成）、全局唯一；
 * 描述可选（≤200 字）；状态可选（默认启用）。
 */
export class CreateQuestionBankDto {
  @ApiProperty({ description: '题库名称（2-50 字，全局唯一）' })
  @IsString()
  @IsNotEmpty({ message: '请输入题库名称' })
  @MinLength(2, { message: '题库名称至少 2 字' })
  @MaxLength(50, { message: '题库名称不超过 50 字' })
  name: string;

  @ApiProperty({ description: '题库编码（≤30 字，全局唯一，留空自动生成）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: '题库编码不超过 30 字' })
  code?: string;

  @ApiProperty({ description: '题库描述（≤200 字）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '题库描述不超过 200 字' })
  description?: string;

  @ApiProperty({ description: '状态 1=启用 0=停用', required: false })
  @IsOptional()
  @IsInt()
  status?: number;
}

/**
 * 更新题库接口入参
 * 通过 id 定位，其余字段同新增。
 */
export class UpdateQuestionBankDto extends CreateQuestionBankDto {
  @ApiProperty({ description: '题库 ID' })
  @IsInt()
  @IsPositive()
  id: number;
}
