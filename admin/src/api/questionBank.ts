/**
 * 题库管理 API
 * 对接 /admin/exam/question-bank/* 接口
 * 统一关闭 http 层错误提示（showErrorMessage: false），由页面自行控制提示文案
 */

import request from '@/utils/http'

/** 题库实体 */
export interface QuestionBank {
  id: number
  name: string
  code: string
  description?: string | null
  status: number
  /** 该题库下题目总数（列表附带的统计字段） */
  questionCount: number
  createTime?: string
  updateTime?: string
}

/** 题库列表分页返回结构 */
export interface QuestionBankListResult {
  list: QuestionBank[]
  pagination: { page: number; pageSize: number; total: number }
}

/** 新增/编辑题库入参（编码留空时后端自动生成） */
export interface QuestionBankPayload {
  name: string
  code?: string
  description?: string
  status: number
}

/** 获取题库列表（分页），支持按名称模糊、状态筛选 */
export function getQuestionBankList(params?: {
  keyword?: string
  status?: number | ''
  page?: number
  pageSize?: number
}) {
  return request.get<QuestionBankListResult>({
    url: '/admin/exam/question-bank/list',
    params,
    showErrorMessage: false
  })
}

/** 新增题库 */
export function addQuestionBank(data: QuestionBankPayload) {
  return request.post({
    url: '/admin/exam/question-bank/add',
    data,
    showErrorMessage: false
  })
}

/** 更新题库 */
export function updateQuestionBank(data: QuestionBankPayload & { id: number }) {
  return request.put({
    url: '/admin/exam/question-bank/update',
    data,
    showErrorMessage: false
  })
}

/** 删除题库（题库下有题目时后端阻止） */
export function deleteQuestionBank(id: number) {
  return request.del({
    url: `/admin/exam/question-bank/delete/${id}`,
    showErrorMessage: false
  })
}

/** 批量删除题库（任一题库下有题目时后端整体阻止） */
export function batchDeleteQuestionBanks(ids: number[]) {
  return request.post({
    url: '/admin/exam/question-bank/batch-delete',
    data: { ids },
    showErrorMessage: false
  })
}

/** 题库 API 聚合导出 */
export const questionBankApi = {
  getList: getQuestionBankList,
  add: addQuestionBank,
  update: updateQuestionBank,
  delete: deleteQuestionBank,
  batchDelete: batchDeleteQuestionBanks
}
