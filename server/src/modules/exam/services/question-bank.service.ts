import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma.service';
import { BaseService } from '@/common/crud';

/** 题库列表筛选条件（keyword 模糊匹配名称，status 精确） */
export interface QuestionBankListFilter {
  keyword?: string;
  status?: number;
}

/**
 * 题库服务
 * 在基础增删改查之上，提供名称/编码唯一性校验、编码自动生成、
 * 带题目数量统计的分页查询，以及删除前的关联保护（题库下有题目 / 被试卷引用）。
 */
@Injectable()
export class QuestionBankService extends BaseService {
  constructor(protected prisma: PrismaService) {
    super(prisma, 'questionBank');
  }

  /**
   * 校验题库名称是否已存在
   * @param name 题库名称
   * @param excludeId 需排除的记录 ID（编辑场景排除自身）
   * @returns 已存在返回 true
   */
  async isNameExists(name: string, excludeId?: number): Promise<boolean> {
    const existing = await this.prisma.questionBank.findFirst({
      where: { name, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * 校验题库编码是否已存在
   * @param code 题库编码
   * @param excludeId 需排除的记录 ID（编辑场景排除自身）
   * @returns 已存在返回 true
   */
  async isCodeExists(code: string, excludeId?: number): Promise<boolean> {
    const existing = await this.prisma.questionBank.findFirst({
      where: { code, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * 生成全局唯一的题库编码（留空时使用）
   * 规则：QB + 时间戳后 6 位 + 2 位随机，冲突则重试，最多 5 次。
   * @returns 唯一编码
   */
  async generateCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const ts = Date.now().toString().slice(-6);
      const rand = Math.floor(Math.random() * 90 + 10);
      const code = `QB${ts}${rand}`;
      if (!(await this.isCodeExists(code))) return code;
    }
    // 兜底：极端并发下用更长随机串，几乎不可能再冲突
    return `QB${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * 分页查询题库（带题目数量统计）
   * keyword 模糊匹配题库名称；status 精确筛选。
   * @param filter 筛选条件
   * @param page 页码
   * @param pageSize 每页条数
   * @returns 列表（每条附 questionCount）及分页信息
   */
  async pageWithCount(filter: QuestionBankListFilter, page?: number, pageSize?: number) {
    const p = Math.max(page || 1, 1);
    const ps = Math.min(Math.max(pageSize || 10, 1), 100);
    const skip = (p - 1) * ps;

    const where: Prisma.QuestionBankWhereInput = {};
    if (filter.keyword) where.name = { contains: filter.keyword };
    if (filter.status !== undefined) where.status = filter.status;

    const [rows, total] = await Promise.all([
      this.prisma.questionBank.findMany({
        where,
        skip,
        take: ps,
        orderBy: { id: 'desc' },
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.questionBank.count({ where }),
    ]);

    const list = rows.map(({ _count, ...qb }) => ({
      ...qb,
      questionCount: _count.questions,
    }));
    return { list, pagination: { page: p, pageSize: ps, total } };
  }

  /**
   * 删除前的关联校验
   * 1) 题库下存在题目时不可删除（SRS 3.5.1.1）；
   * 2) 被试卷/练习引用时不可删除（试卷/练习表尚未建立，逻辑预留）。
   * @param id 题库 ID
   * @throws 命中关联时抛出中文错误
   */
  async ensureDeletable(id: number): Promise<void> {
    const question = await this.prisma.question.findFirst({
      where: { questionBankId: id },
      select: { id: true },
    });
    if (question) {
      throw new Error('该题库下存在题目，请先清空题目后再删除');
    }
    // TODO[试卷/练习模块]: 表建立后校验 paper/practice 是否引用该题库，命中则：
    //   throw new Error('该题库已被试卷或练习引用，无法删除');
  }
}
