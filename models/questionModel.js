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
      
      // questionType 값을 데이터베이스 ENUM 값으로 매핑
      let dbQuestionType;
      switch (questionType) {
        case 'n지 선다형':
          dbQuestionType = 'multiple_choice';
          break;
        case '순서 배열형':
          dbQuestionType = 'sequence';
          break;
        case '참거짓형':
          dbQuestionType = 'true_false';
          break;
        case '빈칸 채우기형':
          dbQuestionType = 'fill_in_the_blank';
          break;
        case '단답형':
          dbQuestionType = 'short_answer';
          break;
        case '서술형':
          dbQuestionType = 'descriptive';
          break;
        default:
          throw new Error(`지원하지 않는 문제 타입입니다: ${questionType}`);
      }
      
      // MySQL에 문제 정보 저장
      const [result] = await pool.execute(
        'INSERT INTO user_questions (user_id, file_name, question_type, mongo_question_id) VALUES (?, ?, ?, ?)',
        [userId, fileName, dbQuestionType, mongoQuestionId]
      );
      
      return {
        selection_id: result.insertId,
        user_id: userId,
        file_name: fileName,
        question_type: questionType,  // 원래 문제 타입 반환 (클라이언트 친화적)
        db_question_type: dbQuestionType, // DB에 저장된 실제 값 (디버깅용)
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
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return rows.map(row => this._mapDbTypeToClientType(row));
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
      
      if (rows.length === 0) return null;
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return this._mapDbTypeToClientType(rows[0]);
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
        // 클라이언트 문제 유형을 DB 문제 유형으로 변환
        const dbQuestionType = this._getDbQuestionType(criteria.questionType);
        query += ' AND question_type = ?';
        params.push(dbQuestionType);
      }
      
      // 정렬 조건 추가
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await pool.execute(query, params);
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return rows.map(row => this._mapDbTypeToClientType(row));
    } catch (error) {
      console.error('문제 검색 오류:', error.message);
      throw error;
    }
  }

  /**
   * 모든 문제 목록 조회
   * @returns {Array} 모든 문제 목록
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_questions ORDER BY created_at DESC'
      );
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return rows.map(row => this._mapDbTypeToClientType(row));
    } catch (error) {
      console.error('모든 문제 조회 오류:', error.message);
      throw error;
    }
  }
  
  /**
   * DB 타입을 클라이언트 타입으로 매핑
   * @private
   * @param {Object} row - DB에서 가져온 행
   * @returns {Object} 클라이언트 타입으로 변환된 행
   */
  static _mapDbTypeToClientType(row) {
    const result = { ...row };
    
    // DB 문제 타입을 클라이언트 문제 타입으로 매핑
    switch (row.question_type) {
      case 'multiple_choice':
        result.question_type = 'n지 선다형';
        break;
      case 'sequence':
        result.question_type = '순서 배열형';
        break;
      case 'true_false':
        result.question_type = '참/거짓형';
        break;
      case 'fill_blank':
        result.question_type = '빈칸 채우기형';
        break;
      case 'short_answer':
        result.question_type = '단답형';
        break;
      case 'essay':
        result.question_type = '서술형';
        break;
    }
    
    return result;
  }
  
  /**
   * 클라이언트 문제 타입을 DB 문제 타입으로 변환
   * @private
   * @param {string} clientType - 클라이언트 문제 타입
   * @returns {string} DB 문제 타입
   */
  static _getDbQuestionType(clientType) {
    switch (clientType) {
      case 'n지 선다형':
        return 'multiple_choice';
      case '순서 배열형':
        return 'sequence';
      case '참/거짓':
        return 'true_false';
      case '빈칸 채우기':
        return 'fill_blank';
      case '단답형':
        return 'short_answer';
      case '서술형':
        return 'essay';
      default:
        return clientType; // 매핑할 수 없는 경우 원래 값 반환
    }
  }
}

module.exports = Question;