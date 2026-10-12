CREATE DATABASE IF NOT EXISTS durnitimap
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE durnitimap;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offices (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  name_bn      VARCHAR(150) NULL,
  type         VARCHAR(80)  NOT NULL,
  division     VARCHAR(50)  NOT NULL,
  district     VARCHAR(50)  NOT NULL,
  upazila      VARCHAR(50)  NULL,
  address      VARCHAR(255) NULL,
  contact_info VARCHAR(150) NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_office_location (division, district),
  INDEX idx_office_name (name)
);

CREATE TABLE services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  office_id   INT NOT NULL,
  name        VARCHAR(150) NOT NULL,
  name_bn     VARCHAR(150) NULL,
  description TEXT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  INDEX idx_service_office (office_id)
);

-- Official information only (one row per service)
CREATE TABLE service_info (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  service_id         INT NOT NULL UNIQUE,
  official_fee       DECIMAL(10,2) NOT NULL DEFAULT 0,
  processing_days    INT NULL,
  required_documents TEXT NULL,
  source_note        VARCHAR(255) NULL,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- user_id is PRIVATE. It must never be returned by public APIs.
CREATE TABLE reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  office_id    INT NOT NULL,
  service_id   INT NOT NULL,
  amount_paid  DECIMAL(10,2) NOT NULL DEFAULT 0,
  waiting_days INT NOT NULL DEFAULT 0,
  visit_count  INT NOT NULL DEFAULT 1,
  description  TEXT NOT NULL,
  status       ENUM('Pending','Approved','Rejected','Flagged') NOT NULL DEFAULT 'Pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (office_id)  REFERENCES offices(id)  ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  INDEX idx_report_user (user_id),
  INDEX idx_report_service_status (service_id, status)
);