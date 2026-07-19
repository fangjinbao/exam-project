<!-- 题库列表：题库的查询、新增、编辑、删除，展示题目数量统计（SRS 3.5.1.1） -->
<template>
  <div class="question-bank-list">
    <!-- 筛选卡片 -->
    <ElCard shadow="never" class="filter-card">
      <ElForm :model="filterForm" :inline="true" class="filter-form">
        <ElFormItem label="题库名称">
          <ElInput
            v-model="filterForm.keyword"
            placeholder="输入题库名称"
            clearable
            class="filter-input"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filterForm.status" placeholder="全部" clearable class="filter-input">
            <ElOption label="启用" :value="1" />
            <ElOption label="停用" :value="0" />
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
        <ElButton v-auth="'add'" type="primary" :icon="Plus" @click="handleAdd">新增题库</ElButton>
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
          <ElTableColumn
            prop="name"
            label="题库名称"
            min-width="180"
            show-overflow-tooltip
            fixed="left"
          />
          <ElTableColumn prop="code" label="题库编码" min-width="140" show-overflow-tooltip />
          <ElTableColumn prop="questionCount" label="题目数量" width="110" align="center" />
          <ElTableColumn prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <ElTag
                :type="row.status === 1 ? 'success' : 'danger'"
                size="small"
                disable-transitions
              >
                {{ row.status === 1 ? '启用' : '停用' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createTime" label="创建时间" width="180" />
          <ElTableColumn label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <ElButton link type="primary" @click="handleEnter(row)">进入题库</ElButton>
              <ElButton v-auth="'update'" link type="primary" @click="handleEdit(row)">编辑</ElButton>
              <ElButton v-auth="'delete'" link type="danger" @click="handleDelete(row)">删除</ElButton>
            </template>
          </ElTableColumn>
          <template #empty>暂无题库数据</template>
        </ElTable>
      </div>

      <!-- 分页 -->
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
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="550px" @closed="resetForm">
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <ElFormItem label="题库名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入题库名称" maxlength="50" show-word-limit />
        </ElFormItem>
        <ElFormItem label="题库编码" prop="code">
          <ElInput v-model="form.code" placeholder="留空由系统自动生成" maxlength="30" show-word-limit />
        </ElFormItem>
        <ElFormItem label="题库描述" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入题库描述"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">停用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { Search, Plus, Delete } from '@element-plus/icons-vue'
  import { questionBankApi, type QuestionBank } from '@/api/questionBank'

  defineOptions({ name: 'QuestionBankList' })

  const router = useRouter()
  const loading = ref(false)
  const tableData = ref<QuestionBank[]>([])
  // 表格勾选的题库 id（批量删除用）
  const selectedIds = ref<number[]>([])

  // 筛选条件
  const filterForm = reactive<{ keyword: string; status: number | '' }>({
    keyword: '',
    status: ''
  })

  // 分页信息
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const dialogVisible = ref(false)
  const isEditing = ref(false)
  const dialogTitle = computed(() => (isEditing.value ? '编辑题库' : '新增题库'))
  const submitLoading = ref(false)

  const formRef = ref<FormInstance>()
  const createForm = (): Partial<QuestionBank> => ({
    id: undefined,
    name: '',
    code: '',
    description: '',
    status: 1
  })
  const form = reactive<Partial<QuestionBank>>(createForm())

  const formRules: FormRules = {
    name: [
      { required: true, message: '请输入题库名称', trigger: 'blur' },
      { min: 2, max: 50, message: '题库名称 2-50 字', trigger: 'blur' }
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  /** 加载题库列表 */
  async function loadList() {
    loading.value = true
    try {
      const { data } = await questionBankApi.getList({
        keyword: filterForm.keyword || undefined,
        status: filterForm.status === '' ? undefined : filterForm.status,
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      tableData.value = data.list
      pagination.total = data.pagination.total
    } catch (error: any) {
      ElMessage.error(error.message || '加载题库列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.page = 1
    loadList()
  }

  function handleReset() {
    filterForm.keyword = ''
    filterForm.status = ''
    pagination.page = 1
    loadList()
  }

  function handleSizeChange() {
    pagination.page = 1
    loadList()
  }

  /** 进入题库：跳转到该题库的题目管理页（bankId/name 走 query，后端菜单驱动模式下路由为静态 /question-bank/questions） */
  function handleEnter(row: QuestionBank) {
    router.push({ path: '/question-bank/questions', query: { bankId: row.id, name: row.name } })
  }

  function handleAdd() {
    isEditing.value = false
    dialogVisible.value = true
  }

  function handleEdit(row: QuestionBank) {
    isEditing.value = true
    dialogVisible.value = true
    Object.assign(form, {
      id: row.id,
      name: row.name,
      code: row.code ?? '',
      description: row.description ?? '',
      status: row.status
    })
  }

  async function handleDelete(row: QuestionBank) {
    try {
      await ElMessageBox.confirm('确定删除该题库吗？', '提示', { type: 'warning' })
      await questionBankApi.delete(row.id)
      ElMessage.success('删除题库成功')
      // 删除后当前页可能为空，回退一页
      if (tableData.value.length === 1 && pagination.page > 1) {
        pagination.page -= 1
      }
      loadList()
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '删除失败')
    }
  }

  /** 表格勾选变化，记录选中题库 id */
  function handleSelectionChange(rows: QuestionBank[]) {
    selectedIds.value = rows.map((r) => r.id)
  }

  /** 批量删除选中的题库 */
  async function handleBatchDelete() {
    if (!selectedIds.value.length) return
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 个题库吗？`,
        '提示',
        { type: 'warning' }
      )
      const count = selectedIds.value.length
      await questionBankApi.batchDelete(selectedIds.value)
      ElMessage.success(`已删除 ${count} 个题库`)
      if (tableData.value.length === count && pagination.page > 1) {
        pagination.page -= 1
      }
      selectedIds.value = []
      loadList()
    } catch (error: any) {
      if (error !== 'cancel') ElMessage.error(error.message || '批量删除失败')
    }
  }

  async function handleSubmit() {
    try {
      await formRef.value?.validate()
      submitLoading.value = true
      const payload = {
        name: form.name!.trim(),
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
        status: form.status!
      }
      if (isEditing.value && form.id) {
        await questionBankApi.update({ id: form.id, ...payload })
        ElMessage.success('编辑题库成功')
      } else {
        await questionBankApi.add(payload)
        ElMessage.success('新增题库成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (error: any) {
      // 校验失败时 validate 抛 false，不提示
      if (error !== false && error) ElMessage.error(error.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  }

  function resetForm() {
    formRef.value?.resetFields()
    Object.assign(form, createForm())
  }

  onMounted(() => loadList())
</script>
<style lang="scss" scoped>
  .question-bank-list {
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
  }
</style>
