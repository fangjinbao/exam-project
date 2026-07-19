-- 幂等补数据：题目管理隐藏菜单 + question_type/difficulty 字典（dev 环境 seed 被跳过时手动执行）
SET NAMES utf8mb4;

-- 1) 题目管理隐藏菜单（父=题库管理目录 /question-bank）。已存在则更新，不存在则插入。
SET @parentId = (SELECT id FROM base_sys_menu WHERE router = '/question-bank' AND type = 0 LIMIT 1);

INSERT INTO base_sys_menu (name, router, perms, type, orderNum, parentId, isShow, keepAlive, createTime, updateTime)
SELECT '题目管理', '/question-bank/questions', 'exam:question:list', 1, 3, @parentId, 0, 1, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM base_sys_menu WHERE router = '/question-bank/questions');

UPDATE base_sys_menu
SET name='题目管理', perms='exam:question:list', type=1, orderNum=3, parentId=@parentId, isShow=0
WHERE router='/question-bank/questions';

-- 2) 字典类型：question_type / difficulty（缺失才建）
INSERT INTO dict_type (name, `key`, createTime, updateTime)
SELECT '题型', 'question_type', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM dict_type WHERE `key`='question_type');

INSERT INTO dict_type (name, `key`, createTime, updateTime)
SELECT '难度', 'difficulty', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM dict_type WHERE `key`='difficulty');

-- 3) 字典项（按 typeId+value 幂等）
SET @qtId = (SELECT id FROM dict_type WHERE `key`='question_type' LIMIT 1);
SET @dfId = (SELECT id FROM dict_type WHERE `key`='difficulty' LIMIT 1);

INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '单选题', 'single', 1, 1, 1, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='single');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '多选题', 'multiple', 2, 1, 1, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='multiple');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '判断题', 'judge', 3, 1, 0, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='judge');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '填空题', 'blank', 4, 1, 0, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='blank');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '问答题', 'qa', 5, 1, 0, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='qa');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @qtId, '论述题', 'essay', 6, 0, 0, NOW(3), NOW(3)
WHERE @qtId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@qtId AND value='essay');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @dfId, '简单', 'easy', 1, 1, 1, NOW(3), NOW(3)
WHERE @dfId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@dfId AND value='easy');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @dfId, '中等', 'medium', 2, 1, 0, NOW(3), NOW(3)
WHERE @dfId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@dfId AND value='medium');
INSERT INTO dict_info (typeId, name, value, orderNum, status, referenced, createTime, updateTime)
SELECT @dfId, '困难', 'hard', 3, 1, 0, NOW(3), NOW(3)
WHERE @dfId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dict_info WHERE typeId=@dfId AND value='hard');

