const { pool } = require('../config/db');

class Summary {
  /**
   * 새 요약 정보 저장
   * @param {Object} summaryData - 요약 데이터 객체
   * @returns {Object} 저장된 요약 정보
   */
  static async create(summaryData) {
    try {
      const { userId, fileName, summaryType, mongoSummaryId } = summaryData;
      
      // 필수 필드 검증
      if (!userId || !fileName || !summaryType || !mongoSummaryId) {
        throw new Error('필수 필드가 누락되었습니다.');
      }
      
      // MySQL에 요약 정보 저장
      const [result] = await pool.execute(
        'INSERT INTO user_summaries (user_id, file_name, summary_type, mongo_summary_id) VALUES (?, ?, ?, ?)',
        [userId, fileName, summaryType, mongoSummaryId]
      );
      
      return {
        selection_id: result.insertId,
        user_id: userId,
        file_name: fileName,
        summary_type: summaryType,
        mongo_summary_id: mongoSummaryId
      };
    } catch (error) {
      console.error('요약 정보 저장 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * 사용자 ID로 요약 목록 조회
   * @param {number} userId - 사용자 ID
   * @returns {Array} 요약 목록
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_summaries WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('요약 목록 조회 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * ID로 특정 요약 조회
   * @param {number} selectionId - 요약 ID
   * @returns {Object|null} 요약 정보 또는 null
   */
  static async findById(selectionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_summaries WHERE selection_id = ?',
        [selectionId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('요약 정보 조회 오류:', error.message);
      throw error;
    }
  }
}

module.exports = Summary;
