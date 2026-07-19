<!-- 题目管理：某题库下题目的查询、增删改查、批量删除与 AI 待审题目审核（SRS 3.5.1） -->
<template>
  <div class="question-manage">
    <!-- 顶部：所属题库标题 + 返回 -->
    <ElCard shadow="never" class="filter-card">
      <div class="page-header">
        <div class="title-wrap">
          <ElButton :icon="ArrowLeft" @click="handleBack">返回题库列表</ElButton>
          <span class="bank-name">题库：{{ bankName || '—' }}</span>
        </div>
      </div>
      <ElForm :model="filterForm" :inline="true" class="filter-form">
        <ElFormItem label="题干">
          <ElInput v-model="filterForm.keyword" placeholder="输入题干关键词" clearable class="filter-input" />
        </ElFormItem>
        <ElFormItem label="题型">
          <ElSelect v-model="filterForm.type" placeholder="全部" clearable class="filter-input">
            <ElOption v-for="it in typeOptions" :key="it.value" :label="it.name" :value="it.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="难度">
          <ElSelect v-model="filterForm.difficulty" placeholder="全部" clearable class="filter-input">
            <ElOption v-for="it in difficultyOptions" :key="it.value" :label="it.name" :value="it.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filterForm.status" placeholder="全部" clearable class="filter-input">
            <ElOption label="正式" value="formal" />
            <ElOption label="待审" value="pending" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :icon="Search" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
    <!-- 表格卡片 -->
    <ElCard shadow="never" class="table-card">
      <div class="table-header">
        <ElButton v-auth="'add'" type="primary" :icon="Plus" @click="handleAdd">新增题目</ElButton>
        <ElButton
          v-auth="'batch-delete'"
          type="danger"
          plain
          :icon="Delete"
          :disabled="!selectedIds.length"
          @click="handleBatchDelete"
        >
          批量删除{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
        </ElButton>
      </div>

      <div class="table-container">
        <ElTable
          v-loading="loading"
          :data="tableData"
          height="100%"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn type="selection" width="50" align="center" fixed="left" />
          <ElTableColumn prop="stem" label="题干" min-width="240" show-overflow-tooltip fixed="left" />
          <ElTableColumn label="题型" width="100" align="center">
            <template #default="{ row }">{{ dictLabel(typeOptions, row.type) }}</template>
          </ElTableColumn>
          <ElTableColumn label="难度" width="90" align="center">
            <template #default="{ row }">
              <ElTag :type="difficultyTagType(row.difficulty)" size="small" disable-transitions>
                {{ dictLabel(difficultyOptions, row.difficulty) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="knowledgePointName" label="知识点" min-width="140" show-overflow-tooltip />
          <ElTableColumn prop="suggestedScore" label="建议分值" width="90" align="center" />
          <ElTableColumn label="状态" width="90" align="center">
            <template #default="{ row }">
              <ElTag :type="row.status === 'formal' ? 'success' : 'warning'" size="small" disable-transitions>
                {{ row.status === 'formal' ? '正式' : '待审' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createTime" label="创建时间" width="170" />
          <ElTableColumn label="操作" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <ElButton link type="primary" @click="handleDetail(row)">详情</ElButton>
              <ElButton v-auth="'update'" link type="primary" @click="handleEdit(row)">编辑</ElButton>
              <template v-if="row.status === 'pending'">
                <ElButton v-auth="'audit'" link type="success" @click="handleApprove(row)">通过</ElButton>
                <ElButton v-auth="'audit'" link type="warning" @click="handleReject(row)">退回</ElButton>
              </template>
              <ElButton v-auth="'delete'" link type="danger" @click="handleDelete(row)">删除</ElButton>
            </template>
          </ElTableColumn>
          <template #empty>暂无题目数据</template>
        </ElTable>
      </div>

      <div class="pagination-container">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="loadList"
        />
      </div>
    </ElCard>
    <!-- 新增/编辑对话框 -->
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="680px" @closed="resetForm">
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <ElFormItem label="题型" prop="type">
          <ElSelect v-model="form.type" placeholder="请选择题型" style="width: 100%">
            <ElOption v-for="it in typeOptions" :key="it.value" :label="it.name" :value="it.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="题干" prop="stem">
          <ElInput
            v-model="form.stem"
            type="textarea"
            :rows="3"
            placeholder="请输入题干"
            maxlength="2000"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem v-if="isObjective" label="选项" prop="options">
          <ElInput
            v-model="form.options"
            type="textarea"
            :rows="4"
            placeholder="每行一个选项，如：A. 选项一"
            maxlength="2000"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="标准答案" prop="answer">
          <ElInput
            v-model="form.answer"
            type="textarea"
            :rows="2"
            placeholder="请输入标准答案"
            maxlength="2000"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="答案解析" prop="analysis">
          <ElInput
            v-model="form.analysis"
            type="textarea"
            :rows="2"
            placeholder="请输入答案解析（选填）"
            maxlength="2000"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="难度" prop="difficulty">
          <ElSelect v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
            <ElOption v-for="it in difficultyOptions" :key="it.value" :label="it.name" :value="it.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="知识点" prop="knowledgePointId">
          <ElTreeSelect
            v-model="form.knowledgePointId"
            :data="knowledgeTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            check-strictly
            :render-after-expand="false"
            placeholder="请选择知识点"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="建议分值" prop="suggestedScore">
          <ElInputNumber v-model="form.suggestedScore" :min="1" :step="1" style="width: 100%" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 详情对话框 -->
    <ElDialog v-model="detailVisible" title="题目详情" width="680px">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="题型">{{ dictLabel(typeOptions, detailData?.type) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="题干">{{ detailData?.stem }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="detailData?.options" label="选项">
          <pre class="pre-text">{{ detailData?.options }}</pre>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="标准答案">{{ detailData?.answer }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="detailData?.analysis" label="答案解析">{{ detailData?.analysis }}</ElDescriptionsItem>
        <ElDescriptionsItem label="难度">{{ dictLabel(difficultyOptions, detailData?.difficulty) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="知识点">{{ detailData?.knowledgePointName || '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="建议分值">{{ detailData?.suggestedScore ?? '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">{{ detailData?.status === 'formal' ? '正式' : '待审' }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="detailData?.rejectReason" label="退回原因">{{ detailData?.rejectReason }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>

    <!-- 审核退回对话框 -->
    <ElDialog v-model="rejectVisible" title="审核退回" width="500px" @closed="rejectReason = ''">
      <ElForm label-width="80px">
        <ElFormItem label="退回原因" required>
          <ElInput
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请填写退回原因（≤200 字）"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="rejectVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="rejectLoading" @click="handleRejectSubmit">确定退回</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { ArrowLeft, Search, Plus, Delete } from '@element-plus/icons-vue'
  import { questionApi, type Question, type QuestionPayload } from '@/api/question'
  import { getDictData, type DictDataItem } from '@/api/dataDict'
  import { knowledgePointApi, type KnowledgePoint } from '@/api/knowledgePoint'

  defineOptions({ name: 'QuestionBankQuestions' })

  const route = useRoute()
  const router = useRouter()

  // 所属题库：从 query 带入（进入题库时传 bankId + name）
  const bankId = computed(() => {
    const v = Number(route.query.bankId)
    return Number.isFinite(v) && v > 0 ? v : undefined
  })
  const bankName = computed(() => (route.query.name as string) || '')

  // 客观题题型（选项必填），与后端 OBJECTIVE_TYPES 对齐
  const OBJECTIVE_TYPES = ['single', 'multiple', 'judge', 'blank']

  const loading = ref(false)
  const tableData = ref<Question[]>([])
  const selectedIds = ref<number[]>([])

  // 字典下拉数据
  const typeOptions = ref<DictDataItem[]>([])
  const difficultyOptions = ref<DictDataItem[]>([])
  // 知识点树（选择器）
  const knowledgeTree = ref<KnowledgePoint[]>([])

  const filterForm = reactive<{
    keyword: string
    type: string
    difficulty: string
    status: string
  }>({ keyword: '', type: '', difficulty: '', status: '' })

  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  // 弹窗状态
  const dialogVisible = ref(false)
  const isEditing = ref(false)
  const dialogTitle = computed(() => (isEditing.value ? '编辑题目' : '新增题目'))
  const submitLoading = ref(false)
  const detailVisible = ref(false)
  const detailData = ref<Question | null>(null)
  const rejectVisible = ref(false)
  const rejectReason = ref('')
  const rejectLoading = ref(false)
  const rejectTargetId = ref<number | null>(null)

  const formRef = ref<FormInstance>()
  const createForm = (): QuestionPayload & { id?: number } => ({
    id: undefined,
    stem: '',
    type: '',
    options: '',
    answer: '',
    analysis: '',
    difficulty: '',
    knowledgePointId: undefined as unknown as number,
    suggestedScore: undefined
  })
  const form = reactive<QuestionPayload & { id?: number }>(createForm())

  // 当前题型是否客观题（决定选项框显隐与必填）
  const isObjective = computed(() => OBJECTIVE_TYPES.includes(form.type))

  const formRules = computed<FormRules>(() => ({
    type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    stem: [{ required: true, message: '请输入题干', trigger: 'blur' }],
    answer: [{ required: true, message: '请输入标准答案', trigger: 'blur' }],
    difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
    knowledgePointId: [{ required: true, message: '请选择知识点', trigger: 'change' }],
    options: isObjective.value
      ? [{ required: true, message: '客观题必须填写选项', trigger: 'blur' }]
      : []
  }))

  /** 由字典 value 取显示名 */
  function dictLabel(opts: DictDataItem[], value?: string | null): string {
    if (!value) return '—'
    return opts.find((o) => o.value === value)?.name ?? value
  }

  /** 难度标签色 */
  function difficultyTagType(value: string): 'success' | 'warning' | 'danger' | 'info' {
    return value === 'easy' ? 'success' : value === 'medium' ? 'warning' : value === 'hard' ? 'danger' : 'info'
  }

  /** 加载题型/难度字典（仅启用项） */
  async function loadDict() {
    try {
      const { data } = await getDictData(['question_type', 'difficulty'])
      typeOptions.value = (data.question_type ?? []).filter((i) => i.status === 1)
      difficultyOptions.value = (data.difficulty ?? []).filter((i) => i.status === 1)
    } catch (error: any) {
      ElMessage.error(error.message || '加载字典失败')
    }
  }

  /** 加载知识点树 */
  async function loadKnowledgeTree() {
    try {
      const { data } = await knowledgePointApi.getTree()
      knowledgeTree.value = data || []
    } catch {
      knowledgeTree.value = []
    }
  }

  /** 加载题目列表（按当前题库过滤） */
  async function loadList() {
    loading.value = true
    try {
      const { data } = await questionApi.getList({
        questionBankId: bankId.value,
        keyword: filterForm.keyword || undefined,
        type: filterForm.type || undefined,
        difficulty: filterForm.difficulty || undefined,
        status: filterForm.status || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      tableData.value = data.list
      pagination.total = data.pagination.total
    } catch (error: any) {
      ElMessage.error(error.message || '加载题目列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleBack() {
    router.push({ path: '/question-bank/list' })
  }

  function handleSearch() {
    pagination.page = 1
    loadList()
  }

  function handleReset() {
    filterForm.keyword = ''
    filterForm.type = ''
    filterForm.difficulty = ''
    filterForm.status = ''
    pagination.page = 1
    loadList()
  }

  function handleSizeChange() {
    pagination.page = 1
    loadList()
  }

  function handleSelectionChange(rows: Question[]) {
    selectedIds.value = rows.map((r) => r.id)
  }

  function handleAdd() {
    isEditing.value = false
    dialogVisible.value = true
  }

  function handleEdit(row: Question) {
    isEditing.value = true
    dialogVisible.value = true
    Object.assign(form, {
      id: row.id,
      stem: row.stem,
      type: row.type,
      options: row.options ?? '',
      answer: row.answer,
      analysis: row.analysis ?? '',
      difficulty: row.difficulty,
      knowledgePointId: row.knowledgePointId,
      suggestedScore: row.suggestedScore ?? undefined
    })
  }

  async function handleDetail(row: Question) {
    try {
      const { data } = await questionApi.getDetail(row.id)
      detailData.value = data
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '加载详情失败')
    }
  }

  async function handleDelete(row: Question) {
    try {
      await ElMessageBox.confirm('确定删除该题目吗？', '提示', { type: 'warning' })
      await questionApi.delete(row.id)
      ElMessage.success('删除题目成功')
      if (tableData.value.length === 1 && pagination.page > 1) pagination.page -= 1
      loadList()
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
    }
  }

  async function handleBatchDelete() {
    if (!selectedIds.value.length) return
    try {
      const count = selectedIds.value.length
      await ElMessageBox.confirm(`确定要删除选中的 ${count} 道题目吗？`, '提示', { type: 'warning' })
      await questionApi.batchDelete(selectedIds.value)
      ElMessage.success(`已删除 ${count} 道题目`)
      if (tableData.value.length === count && pagination.page > 1) pagination.page -= 1
      selectedIds.value = []
      loadList()
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '批量删除失败')
    }
  }

  async function handleApprove(row: Question) {
    try {
      await ElMessageBox.confirm('确定审核通过该题目吗？', '提示', { type: 'warning' })
      await questionApi.approve(row.id)
      ElMessage.success('审核通过，题目已转为正式')
      loadList()
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '审核失败')
    }
  }

  function handleReject(row: Question) {
    rejectTargetId.value = row.id
    rejectReason.value = ''
    rejectVisible.value = true
  }

  async function handleRejectSubmit() {
    if (!rejectReason.value.trim()) {
      ElMessage.warning('请填写退回原因')
      return
    }
    if (rejectTargetId.value == null) return
    rejectLoading.value = true
    try {
      await questionApi.reject(rejectTargetId.value, rejectReason.value.trim())
      ElMessage.success('已退回')
      rejectVisible.value = false
      loadList()
    } catch (error: any) {
      ElMessage.error(error.message || '退回失败')
    } finally {
      rejectLoading.value = false
    }
  }

  async function handleSubmit() {
    try {
      await formRef.value?.validate()
      submitLoading.value = true
      const payload: QuestionPayload = {
        stem: form.stem.trim(),
        type: form.type,
        options: isObjective.value ? form.options?.trim() || undefined : undefined,
        answer: form.answer.trim(),
        analysis: form.analysis?.trim() || undefined,
        difficulty: form.difficulty,
        knowledgePointId: form.knowledgePointId,
        questionBankId: bankId.value,
        suggestedScore: form.suggestedScore || undefined
      }
      if (isEditing.value && form.id) {
        await questionApi.update({ id: form.id, ...payload })
        ElMessage.success('编辑题目成功')
      } else {
        await questionApi.add(payload)
        ElMessage.success('新增题目成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (error: any) {
      if (error !== false && error) ElMessage.error(error.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  }

  function resetForm() {
    formRef.value?.resetFields()
    Object.assign(form, createForm())
  }

  onMounted(() => {
    loadDict()
    loadKnowledgeTree()
    loadList()
  })
</script>
<style lang="scss" scoped>
  .question-manage {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .filter-card {
      flex-shrink: 0;
      border: none !important;
      box-shadow: none !important;
      border-radius: 12px;

      :deep(.el-card__body) {
        padding: 12px 20px;
      }

      .page-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;

          .bank-name {
            font-size: 15px;
            font-weight: 600;
          }
        }
      }

      .filter-form {
        @include responsiveFilterForm();
      }
    }

    .table-card {
      flex: 1;
      border: none !important;
      box-shadow: none !important;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      :deep(.el-card__body) {
        padding: 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .table-header {
        flex-shrink: 0;
        margin-bottom: 16px;
        display: flex;
        gap: 12px;
      }

      .table-container {
        flex: 1;
        overflow: hidden;
      }

      .pagination-container {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
      }
    }

    .pre-text {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
    }
  }
</style>
