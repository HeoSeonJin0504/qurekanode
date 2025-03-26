const { pool } = require('../config/db');

class Question {
  /**
   * 새 문제 정보 저장
   * @param {Object} questionData - 문제 데이터 객체
   * @returns {Object} 저장된 문제 정보
   */
  static async create(questionData) {
    try {
      const { userId, fileName, questionType, mongoQuestionId } = questionData;
      
      // 필수 필드 검증
      if (!userId || !fileName || !questionType || !mongoQuestionId) {
        throw new Error('필수 필드가 누락되었습니다.');
      }
      
      // MySQL에 문제 정보 저장
      const [result] = await pool.execute(
        'INSERT INTO user_questions (user_id, file_name, question_type, mongo_question_id) VALUES (?, ?, ?, ?)',
        [userId, fileName, questionType, mongoQuestionId]
      );
      
      return {
        selection_id: result.insertId,
        user_id: userId,
        file_name: fileName,
        question_type: questionType,
        mongo_question_id: mongoQuestionId
      };
    } catch (error) {
      console.error('문제 정보 저장 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * 사용자 ID로 문제 목록 조회
   * @param {number} userId - 사용자 ID
   * @returns {Array} 문제 목록
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_questions WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('문제 목록 조회 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * ID로 특정 문제 조회
   * @param {number} selectionId - 문제 ID
   * @returns {Object|null} 문제 정보 또는 null
   */
  static async findById(selectionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_questions WHERE selection_id = ?',
        [selectionId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('문제 정보 조회 오류:', error.message);
      throw error;
    }
  }

  /**
   * 문제 검색
   * @param {Object} criteria - 검색 조건
   * @returns {Array} 검색 결과
   */
  static async searchQuestions(criteria) {
    try {
      let query = 'SELECT * FROM user_questions WHERE user_id = ?';
      let params = [criteria.userId];
      
      // 파일명 검색어가 있으면 조건 추가
      if (criteria.searchQuery) {
        query += ' AND file_name LIKE ?';
        params.push(`%${criteria.searchQuery}%`);
      }
      
      // 문제 유형 조건이 있으면 추가
      if (criteria.questionType) {
        query += ' AND question_type = ?';
        params.push(criteria.questionType);
      }
      
      // 정렬 조건 추가
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('문제 검색 오류:', error.message);
      throw error;
    }
  }
}

module.exports = Question;
