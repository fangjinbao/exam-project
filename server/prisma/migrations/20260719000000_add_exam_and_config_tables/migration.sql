
-- AlterTable
ALTER TABLE `dict_info` ADD COLUMN `referenced` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `biz_issue_type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `auditorId` INTEGER NULL,
    `orderNum` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `biz_issue_type_auditorId_idx`(`auditorId`),
    INDEX `biz_issue_type_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_param_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(500) NULL,
    `valueType` VARCHAR(20) NOT NULL DEFAULT 'int',
    `minValue` INTEGER NULL,
    `maxValue` INTEGER NULL,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `sys_param_config_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_ai_model` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `apiUrl` VARCHAR(500) NOT NULL,
    `apiKey` VARCHAR(500) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `connStatus` VARCHAR(20) NOT NULL DEFAULT 'unknown',
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_ai_model_name_key`(`name`),
    INDEX `sys_ai_model_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_operation_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operator` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `target` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `sourceIp` VARCHAR(50) NOT NULL,
    `operateTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `sys_operation_log_operator_idx`(`operator`),
    INDEX `sys_operation_log_type_idx`(`type`),
    INDEX `sys_operation_log_operateTime_idx`(`operateTime`),
    INDEX `sys_operation_log_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_external_org` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NULL,
    `contact` VARCHAR(50) NULL,
    `phone` VARCHAR(20) NULL,
    `address` VARCHAR(200) NULL,
    `remark` VARCHAR(200) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_external_org_name_key`(`name`),
    UNIQUE INDEX `exam_external_org_code_key`(`code`),
    INDEX `exam_external_org_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_external_candidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `orgId` INTEGER NOT NULL,
    `idCard` VARCHAR(30) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(50) NULL,
    `password` VARCHAR(191) NOT NULL,
    `passwordV` INTEGER NOT NULL DEFAULT 1,
    `status` INTEGER NOT NULL DEFAULT 1,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_external_candidate_phone_key`(`phone`),
    INDEX `exam_external_candidate_orgId_idx`(`orgId`),
    INDEX `exam_external_candidate_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_site` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `address` VARCHAR(200) NOT NULL,
    `capacity` INTEGER NULL,
    `contact` VARCHAR(50) NULL,
    `phone` VARCHAR(11) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_site_name_key`(`name`),
    INDEX `exam_site_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_knowledge_point` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parentId` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `orderNum` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(200) NULL,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `exam_knowledge_point_parentId_idx`(`parentId`),
    INDEX `exam_knowledge_point_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stem` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `options` TEXT NULL,
    `answer` TEXT NOT NULL,
    `analysis` TEXT NULL,
    `difficulty` VARCHAR(20) NOT NULL,
    `knowledgePointId` INTEGER NOT NULL,
    `suggestedScore` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'formal',
    `rejectReason` VARCHAR(200) NULL,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `exam_question_knowledgePointId_idx`(`knowledgePointId`),
    INDEX `exam_question_type_idx`(`type`),
    INDEX `exam_question_difficulty_idx`(`difficulty`),
    INDEX `exam_question_status_idx`(`status`),
    INDEX `exam_question_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exam_external_candidate` ADD CONSTRAINT `exam_external_candidate_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `exam_external_org`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_question` ADD CONSTRAINT `exam_question_knowledgePointId_fkey` FOREIGN KEY (`knowledgePointId`) REFERENCES `exam_knowledge_point`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
