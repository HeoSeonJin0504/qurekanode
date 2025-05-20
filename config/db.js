const mysql = require('mysql2/promise');
require('dotenv').config();
const logger = require('../utils/logger');

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
});

// 데이터베이스 연결 및 테이블 초기화
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('MySQL 데이터베이스 연결 성공');
    connection.release();
    
    // 필수 테이블 생성 확인 (로깅 최소화)
    await createRequiredTables();
    logger.info('데이터베이스 테이블 확인 완료');
  } catch (error) {
    logger.error('데이터베이스 연결 실패', error);
    process.exit(1);
  }
}

// 필수 테이블 생성 함수 분리
async function createRequiredTables() {
  // 사용자 테이블
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      userindex INT AUTO_INCREMENT PRIMARY KEY,
      userid VARCHAR(30) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(50) NOT NULL,
      age INT NOT NULL,
      gender ENUM('male', 'female', 'other') NOT NULL,
      phone VARCHAR(15) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NULL
    )
  `);
  
  // 리프레시 토큰 테이블
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS refresh_token (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(userindex) ON DELETE CASCADE
    )
  `);
  
  // 요약 정보 테이블
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_summaries (
      selection_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      summary_type ENUM('기본 요약', '핵심 요약', '주제 요약', '목차 요약', '키워드 요약') NOT NULL,
      mongo_summary_id VARCHAR(24) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(userindex) ON DELETE CASCADE
    )
  `);
  
  // 문제 정보 테이블
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_questions (
      selection_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      question_type ENUM('n지 선다형', '순서 배열형', '참/거짓', '빈칸 채우기', '단답형', '서술형') NOT NULL,
      mongo_question_id VARCHAR(24) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(userindex) ON DELETE CASCADE
    )
  `);
}

module.exports = { pool, testConnection };
