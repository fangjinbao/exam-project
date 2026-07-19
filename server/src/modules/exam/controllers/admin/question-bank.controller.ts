import { Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CrudController, CrudControllerFactory } from '@/common/crud';
import { ApiResult, ApiOkVoid, Perms } from '@/common/decorators';
import { QuestionBankService } from '../../services/question-bank.service';
import { CreateQuestionBankDto, UpdateQuestionBankDto } from '../../dto/question-bank.dto';
import { QuestionBankVo } from '../../vo/question-bank.vo';

/**
 * 题库管理控制器
 * 提供题库的分页查询（带题目数量统计）、新增、编辑、删除。
 * 列表支持按题库名称模糊、状态精确筛选；
 * 新增/编辑校验名称与编码唯一（编码留空时自动生成），删除时校验题库下是否存在题目。
 */
@ApiTags('题库管理')
@CrudController({
  prefix: 'admin/exam/question-bank',
})
export class QuestionBankController extends CrudControllerFactory(QuestionBankVo) {
  constructor(private readonly questionBankService: QuestionBankService) {
    super(questionBankService);
  }

  /**
   * 分页查询题库（带题目数量统计）
   * 覆盖基类 list：基类默认不含 questionCount 聚合，此处走 service 的带统计查询。
   */
  @Get('list')
  @Perms('list')
  @ApiOperation({ summary: '分页查询题库（带题目数量统计）' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从 1 开始' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数（1-100）' })
  @ApiQuery({ name: 'keyword', required: false, description: '题库名称（模糊）' })
  @ApiQuery({ name: 'status', required: false, description: '状态 1=启用 0=停用' })
  async list(@Query() query: Record<string, any>) {
    const status =
      typeof query.status === 'string' && /^-?\d+$/.test(query.status)
        ? Number(query.status)
        : undefined;
    const result = await this.questionBankService.pageWithCount(
      { keyword: query.keyword, status },
      query.page ? Number(query.page) : undefined,
      query.pageSize ? Number(query.pageSize) : undefined,
    );
    return this.ok(result);
  }

  /**
   * 新增题库
   * 校验名称唯一；编码留空则自动生成，填写则校验唯一后创建。
   */
  @Post('add')
  @Perms('add')
  @ApiOperation({ summary: '新增题库（校验名称/编码唯一，编码留空自动生成）' })
  @ApiResult(QuestionBankVo)
  async add(@Body() dto: CreateQuestionBankDto) {
    if (await this.questionBankService.isNameExists(dto.name)) {
      return this.fail(`题库【${dto.name}】已存在，请更换名称`);
    }
    let code = dto.code?.trim();
    if (code) {
      if (await this.questionBankService.isCodeExists(code)) {
        return this.fail(`题库编码【${code}】已存在，请更换`);
      }
    } else {
      code = await this.questionBankService.generateCode();
    }
    const bank = await this.questionBankService.add({
      name: dto.name,
      code,
      description: dto.description ?? null,
      status: dto.status ?? 1,
    });
    return this.ok(bank, '新增题库成功');
  }

  /**
   * 更新题库
   * 校验名称与编码唯一（排除自身）后更新；编码留空则保持不变（不重新生成）。
   */
  @Put('update')
  @Perms('update')
  @ApiOperation({ summary: '更新题库（校验名称/编码唯一）' })
  @ApiOkVoid()
  async update(@Body() dto: UpdateQuestionBankDto) {
    const { id, code, ...rest } = dto;
    if (await this.questionBankService.isNameExists(dto.name, id)) {
      return this.fail(`题库【${dto.name}】已存在，请更换名称`);
    }
    const trimmedCode = code?.trim();
    if (trimmedCode && (await this.questionBankService.isCodeExists(trimmedCode, id))) {
      return this.fail(`题库编码【${trimmedCode}】已存在，请更换`);
    }
    await this.questionBankService.update(id, {
      ...rest,
      // 编码留空时不覆盖原值（保持编辑前的编码）
      ...(trimmedCode ? { code: trimmedCode } : {}),
    });
    return this.ok(null, '编辑题库成功');
  }

  /**
   * 删除题库
   * 题库下存在题目时阻止删除。
   */
  @Delete('delete/:id')
  @Perms('delete')
  @ApiOperation({ summary: '按 id 删除题库（题库下有题目时阻止）' })
  @ApiParam({ name: 'id', description: '题库 ID', type: Number })
  @ApiOkVoid()
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.questionBankService.ensureDeletable(id);
    } catch (error) {
      return this.fail(error instanceof Error ? error.message : '无法删除');
    }
    await this.questionBankService.delete([id]);
    return this.ok(null, '删除题库成功');
  }

  /**
   * 批量删除题库
   * 逐个执行"题库下有题目则阻止"校验，任一命中即整体失败不删除。
   * 覆盖基类 batch-delete：基类直删会绕过 ensureDeletable 关联保护。
   */
  @Post('batch-delete')
  @Perms('batch-delete')
  @ApiOperation({ summary: '批量删除题库（题库下有题目时整体阻止）' })
  @ApiOkVoid()
  async batchDelete(@Body() body: { ids: number[] }) {
    if (!body.ids?.length || !body.ids.every((id) => typeof id === 'number')) {
      return this.fail('ids 格式不正确');
    }
    try {
      for (const id of body.ids) {
        await this.questionBankService.ensureDeletable(id);
      }
    } catch (error) {
      return this.fail(error instanceof Error ? error.message : '无法删除');
    }
    await this.questionBankService.delete(body.ids);
    return this.ok(null, `已删除 ${body.ids.length} 个题库`);
  }
}
