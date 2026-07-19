/**
 * 题目管理 API
 * 对接 /admin/exam/question/* 接口
 * 统一关闭 http 层错误提示（showErrorMessage: false），由页面自行控制提示文案
 */

import request from '@/utils/http'

/** 题目实体 */
export interface Question {
  id: number
  /** 题干 */
  stem: string
  /** 题型（字典 question_type 的 value：single/multiple/judge/blank/qa/essay） */
  type: string
  /** 选项（多行文本，主观题为空） */
  options?: string | null
  /** 标准答案 */
  answer: string
  /** 答案解析 */
  analysis?: string | null
  /** 难度（字典 difficulty 的 value：easy/medium/hard） */
  difficulty: string
  /** 所属知识点 ID */
  knowledgePointId: number
  /** 所属知识点名称（列表带出） */
  knowledgePointName?: string | null
  /** 所属题库 ID */
  questionBankId?: number | null
  /** 建议分值 */
  suggestedScore?: number | null
  /** 状态：formal 正式 / pending 待审 */
  status: string
  /** 退回原因 */
  rejectReason?: string | null
  createTime?: string
  updateTime?: string
}

/** 题目列表分页返回结构 */
export interface QuestionListResult {
  list: Question[]
  pagination: { page: number; pageSize: number; total: number }
}

/** 新增/编辑题目入参 */
export interface QuestionPayload {
  stem: string
  type: string
  options?: string
  answer: string
  analysis?: string
  difficulty: string
  knowledgePointId: number
  questionBankId?: number
  suggestedScore?: number
}

/** 题目列表查询参数 */
export interface QuestionListParams {
  keyword?: string
  type?: string
  difficulty?: string
  knowledgePointId?: number
  questionBankId?: number
  status?: string
  page?: number
  pageSize?: number
}

/** 获取题目列表（分页），支持题干模糊 + 题型/难度/知识点/题库/状态筛选 */
export function getQuestionList(params?: QuestionListParams) {
  return request.get<QuestionListResult>({
    url: '/admin/exam/question/list',
    params,
    showErrorMessage: false
  })
}

/** 题目详情 */
export function getQuestionDetail(id: number) {
  return request.get<Question>({
    url: `/admin/exam/question/detail/${id}`,
    showErrorMessage: false
  })
}

/** 新增题目 */
export function addQuestion(data: QuestionPayload) {
  return request.post({
    url: '/admin/exam/question/add',
    data,
    showErrorMessage: false
  })
}

/** 更新题目 */
export function updateQuestion(data: QuestionPayload & { id: number }) {
  return request.put({
    url: '/admin/exam/question/update',
    data,
    showErrorMessage: false
  })
}

/** 删除题目（被试卷引用时后端阻止） */
export function deleteQuestion(id: number) {
  return request.del({
    url: `/admin/exam/question/delete/${id}`,
    showErrorMessage: false
  })
}

/** 批量删除题目 */
export function batchDeleteQuestions(ids: number[]) {
  return request.post({
    url: '/admin/exam/question/batch-delete',
    data: { ids },
    showErrorMessage: false
  })
}

/** 审核通过（待审 → 正式） */
export function approveQuestion(id: number) {
  return request.post({
    url: '/admin/exam/question/audit/approve',
    data: { id },
    showErrorMessage: false
  })
}

/** 审核退回（记录退回原因，保持待审） */
export function rejectQuestion(id: number, reason: string) {
  return request.post({
    url: '/admin/exam/question/audit/reject',
    data: { id, reason },
    showErrorMessage: false
  })
}

/** 题目 API 聚合导出 */
export const questionApi = {
  getList: getQuestionList,
  getDetail: getQuestionDetail,
  add: addQuestion,
  update: updateQuestion,
  delete: deleteQuestion,
  batchDelete: batchDeleteQuestions,
  approve: approveQuestion,
  reject: rejectQuestion
}
