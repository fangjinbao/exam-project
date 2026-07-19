-- AlterTable
ALTER TABLE `exam_question` ADD COLUMN `questionBankId` INTEGER NULL;

-- CreateTable
CREATE TABLE `exam_question_bank` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` VARCHAR(200) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `tenantId` INTEGER NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_question_bank_name_key`(`name`),
    UNIQUE INDEX `exam_question_bank_code_key`(`code`),
    INDEX `exam_question_bank_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `exam_question_questionBankId_idx` ON `exam_question`(`questionBankId`);

-- AddForeignKey
ALTER TABLE `exam_question` ADD CONSTRAINT `exam_question_questionBankId_fkey` FOREIGN KEY (`questionBankId`) REFERENCES `exam_question_bank`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

