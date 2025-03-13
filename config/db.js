const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qureta_db'
});

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 데이터베이스 연결 성공');
    connection.release();
    
    // 사용자 테이블이 없으면 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        \`index\` INT AUTO_INCREMENT PRIMARY KEY,
        userid VARCHAR(30) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50) NOT NULL,
        age INT NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NULL
      )
    `);
    console.log('사용자 테이블 확인 완료');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
