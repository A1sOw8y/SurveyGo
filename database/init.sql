-- ============================================
-- SurveyGo 数据库初始化脚本
-- 对应：问卷调查系统全部数据表
-- ============================================

CREATE DATABASE IF NOT EXISTS surveygo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE surveygo;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 问卷表
CREATE TABLE IF NOT EXISTS surveys (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    creator_id  INT          NOT NULL,
    status      ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
    share_code  VARCHAR(32)  NOT NULL UNIQUE,
    deadline    DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. 题目表（选项用 JSON 存储，不建独立选项表）
CREATE TABLE IF NOT EXISTS questions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    survey_id  INT          NOT NULL,
    type       ENUM('single','multi','text') NOT NULL,
    title      VARCHAR(500) NOT NULL,
    options    JSON         NULL COMMENT '选项JSON, 格式: [{"id":"o1","text":"选项A"},...]',
    sort_order INT          NOT NULL DEFAULT 0,
    required   TINYINT      NOT NULL DEFAULT 1,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. 答卷表（一次提交 = 一条记录）
CREATE TABLE IF NOT EXISTS responses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    survey_id    INT      NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. 答案明细表
CREATE TABLE IF NOT EXISTS answers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT          NOT NULL,
    question_id INT          NOT NULL,
    option_ids  VARCHAR(200) NULL COMMENT '选中选项ID, 逗号分隔, e.g. "o1" 或 "o1,o3"',
    text_content TEXT        NULL COMMENT '简答题文字答案',
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 索引
CREATE INDEX idx_surveys_creator   ON surveys(creator_id);
CREATE INDEX idx_surveys_status    ON surveys(status);
CREATE INDEX idx_surveys_share     ON surveys(share_code);
CREATE INDEX idx_questions_survey  ON questions(survey_id);
CREATE INDEX idx_responses_survey  ON responses(survey_id);
CREATE INDEX idx_answers_response  ON answers(response_id);
CREATE INDEX idx_answers_question  ON answers(question_id);
