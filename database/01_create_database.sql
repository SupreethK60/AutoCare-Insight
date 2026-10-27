-- ============================================================
-- AutoCare Insight — Vehicle Service Management System
-- Script 01: Create Database
-- ============================================================

DROP DATABASE IF EXISTS autocare_insight;
CREATE DATABASE autocare_insight
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE autocare_insight;

-- Confirm
SELECT 'Database autocare_insight created successfully.' AS status;
