import { ApiProperty } from '@nestjs/swagger';

/**
 * 题库响应 VO
 * 题库为基础数据，无敏感字段，字段与 Prisma QuestionBank model 一致；
 * questionCount 为列表附带的题目数量统计（非表字段，由 service 聚合得出）。
 */
export class QuestionBankVo {
  @ApiProperty({ description: '题库 ID' })
  id: number;

  @ApiProperty({ description: '题库名称（全局唯一）' })
  name: string;

  @ApiProperty({ description: '题库编码（全局唯一）' })
  code: string;

  @ApiProperty({ description: '题库描述', nullable: true })
  description: string | null;

  @ApiProperty({ description: '状态 1=启用 0=停用' })
  status: number;

  @ApiProperty({ description: '该题库下题目总数（系统统计）' })
  questionCount: number;

  @ApiProperty({ description: '创建时间' })
  createTime: string;

  @ApiProperty({ description: '更新时间' })
  updateTime: string;
}
