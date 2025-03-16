const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class Token {
  /**
   * 리프레시 토큰 저장
   * @param {number} userId - 사용자 ID
   * @param {string} token - 리프레시 토큰
   * @param {Date} expiresAt - 토큰 만료 시간
   * @returns {Object} 저장된 토큰 정보
   */
  static async saveRefreshToken(userId, hashedToken, expiresAt) {
    try {
      // 필수 파라미터 검증
      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }
      
      if (!hashedToken) {
        throw new Error('토큰 값이 필요합니다.');
      }
      
      if (!expiresAt) {
        throw new Error('만료 시간이 필요합니다.');
      }
      
      console.log(`리프레시 토큰 저장 시도 - 사용자 ID: ${userId}`);
      
      // 이전 리프레시 토큰 삭제
      await this.deleteRefreshToken(userId);
      
      // 새 리프레시 토큰 저장
      const [result] = await pool.execute(
        'INSERT INTO refresh_token (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, hashedToken, expiresAt]
      );
      
      console.log(`리프레시 토큰 저장 성공 - ID: ${result.insertId}`);
      
      return {
        id: result.insertId,
        userId,
        token: hashedToken, // 해시된 토큰
        expiresAt
      };
    } catch (error) {
      console.error('리프레시 토큰 저장 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * 리프레시 토큰 조회
   * @param {string} token - 리프레시 토큰
   * @returns {Object|null} 토큰 정보 또는 null
   */
  static async findRefreshToken(plainToken) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM refresh_token'
      );
      
      // 전부 bcrypt.compare 해보고 일치하는지 확인
      for (const row of rows) {
        const isMatch = await bcrypt.compare(plainToken, row.token);
        if (isMatch) {
          return row;
        }
      }
      
      // 일치하는 해시가 없다면 null
      return null;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 사용자 ID로 리프레시 토큰 삭제
   * @param {number} userId - 사용자 ID
   * @returns {boolean} 성공 여부
   */
  static async deleteRefreshToken(userId) {
    try {
      // 파라미터 검증
      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }
      
      const [result] = await pool.execute(
        'DELETE FROM refresh_token WHERE user_id = ?',
        [userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('리프레시 토큰 삭제 오류:', error);
      throw error;
    }
  }
  
  /**
   * 토큰으로 리프레시 토큰 삭제
   * @param {string} token - 리프레시 토큰
   * @returns {boolean} 성공 여부
   */
  static async deleteRefreshTokenByToken(plainToken) {
    try {
      // 해시 매칭을 위해 findRefreshToken으로 레코드 조회 후, ID 기반 삭제
      const tokenRecord = await this.findRefreshToken(plainToken);
      if (!tokenRecord) {
        return false;
      }
      
      const [result] = await pool.execute(
        'DELETE FROM refresh_token WHERE id = ?',
        [tokenRecord.id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 만료된 리프레시 토큰 삭제
   * @returns {number} 삭제된 토큰 수
   */
  static async deleteExpiredTokens() {
    try {
      const [result] = await pool.execute(
        'DELETE FROM refresh_token WHERE expires_at < NOW()'
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Token;
