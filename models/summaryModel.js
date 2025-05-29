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
      
      // summaryType 값을 데이터베이스 ENUM 값으로 매핑
      let dbSummaryType;
      switch (summaryType) {
        case '기본 요약':
        case '내용 요약_기본 요약':
          dbSummaryType = 'basic';
          break;
        case '핵심 요약':
        case '내용 요약_핵심 요약':
          dbSummaryType = 'key_points';
          break;
        case '주제 요약':
        case '내용 요약_주제 요약':
          dbSummaryType = 'topic';
          break;
        case '목차 요약':
        case '내용 요약_목차 요약':
          dbSummaryType = 'outline';
          break;
        case '키워드 요약':
        case '내용 요약_키워드 요약':
          dbSummaryType = 'keywords';
          break;
        default:
          throw new Error(`지원하지 않는 요약 타입입니다: ${summaryType}`);
      }
      
      // MySQL에 요약 정보 저장
      const [result] = await pool.execute(
        'INSERT INTO user_summaries (user_id, file_name, summary_type, mongo_summary_id) VALUES (?, ?, ?, ?)',
        [userId, fileName, dbSummaryType, mongoSummaryId]
      );
      
      return {
        selection_id: result.insertId,
        user_id: userId,
        file_name: fileName,
        summary_type: summaryType,  // 원래 요약 타입 반환 (클라이언트 친화적)
        db_summary_type: dbSummaryType, // DB에 저장된 실제 값 (디버깅용)
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
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return rows.map(row => this._mapDbTypeToClientType(row));
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
      
      if (rows.length === 0) return null;
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return this._mapDbTypeToClientType(rows[0]);
    } catch (error) {
      console.error('요약 정보 조회 오류:', error.message);
      throw error;
    }
  }

  /**
   * 요약 검색
   * @param {Object} criteria - 검색 조건
   * @returns {Array} 검색 결과
   */
  static async searchSummaries(criteria) {
    try {
      let query = 'SELECT * FROM user_summaries WHERE user_id = ?';
      let params = [criteria.userId];
      
      // 파일명 검색어가 있으면 조건 추가
      if (criteria.searchQuery) {
        query += ' AND file_name LIKE ?';
        params.push(`%${criteria.searchQuery}%`);
      }
      
      // 요약 유형 조건이 있으면 추가
      if (criteria.summaryType) {
        // 클라이언트 요약 유형을 DB 요약 유형으로 변환
        const dbSummaryType = this._getDbSummaryType(criteria.summaryType);
        query += ' AND summary_type = ?';
        params.push(dbSummaryType);
      }
      
      // 정렬 조건 추가
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await pool.execute(query, params);
      
      // DB 값을 클라이언트 친화적인 값으로 매핑
      return rows.map(row => this._mapDbTypeToClientType(row));
    } catch (error) {
      console.error('요약 검색 오류:', error.message);
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
    
    // DB 요약 타입을 클라이언트 요약 타입으로 매핑
    switch (row.summary_type) {
      case 'basic':
        result.summary_type = '기본 요약';
        break;
      case 'key_points':
        result.summary_type = '핵심 요약';
        break;
      case 'topic':
        result.summary_type = '주제 요약';
        break;
      case 'outline':
        result.summary_type = '목차 요약';
        break;
      case 'keywords':
        result.summary_type = '키워드 요약';
        break;
    }
    
    return result;
  }
  
  /**
   * 클라이언트 요약 타입을 DB 요약 타입으로 변환
   * @private
   * @param {string} clientType - 클라이언트 요약 타입
   * @returns {string} DB 요약 타입
   */
  static _getDbSummaryType(clientType) {
    switch (clientType) {
      case '기본 요약':
        return '내용 요약_기본 요약';
      case '핵심 요약':
        return ' 내용 요약_핵심 요약';
      case '주제 요약':
        return ' 내용 요약_주제 요약';
      case '목차 요약':
        return ' 내용 요약_목차 요약';
      case '키워드 요약':
        return ' 내용 요약_키워드 요약';
      default:
        return clientType; // 매핑할 수 없는 경우 원래 값 반환
    }
  }
}

module.exports = Summary;