-- Module 2 / FR4 (Nahid): saved snapshot of each office's Transparency Indicator.
CREATE TABLE transparency_scores (
  office_id            INT PRIMARY KEY,
  score                TINYINT UNSIGNED NULL,
  level                ENUM('high','moderate','low','not_enough_data') NOT NULL,
  confidence           ENUM('low','medium','high') NOT NULL,
  approved_reports     INT NOT NULL DEFAULT 0,
  verification_rate    DECIMAL(5,1) NULL,
  reports_last_90_days INT NOT NULL DEFAULT 0,
  trend                ENUM('improving','stable','declining','unknown') NOT NULL DEFAULT 'unknown',
  fee_score            DECIMAL(5,1) NULL,
  time_score           DECIMAL(5,1) NULL,
  visit_score          DECIMAL(5,1) NULL,
  calculated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE
);
