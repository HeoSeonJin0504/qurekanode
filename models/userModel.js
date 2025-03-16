const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  /**
   * 사용자 정보로 회원가입
   * @param {Object} userData - 사용자 데이터
   * @returns {Object} 생성된 사용자 정보
   */
  static async create(userData) {
    try {
      // 비밀번호 해시화 (보안을 위해)
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // 사용자 정보 데이터베이스에 저장
      const [result] = await pool.execute(
        'INSERT INTO users (userid, password, name, age, gender, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          userData.userid, 
          hashedPassword, 
          userData.name, 
          userData.age, 
          userData.gender, 
          userData.phone, 
          userData.email
        ]
      );
      
      // 민감한 정보를 제외한 사용자 정보 반환
      return {
        userindex: result.insertId,
        userid: userData.userid,
        name: userData.name,
        email: userData.email
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자 아이디로 사용자 조회 (아이디 중복 확인용)
   * @param {string} userid - 사용자 아이디
   * @returns {Object|null} 사용자 정보 또는 null
   */
  static async findByUserid(userid) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE userid = ?',
        [userid]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 아이디와 비밀번호로 로그인 검증
   * @param {string} userid - 사용자 아이디
   * @param {string} password - 비밀번호
   * @returns {Object|null} 인증 성공 시 사용자 정보, 실패 시 null
   */
  static async authenticate(userid, password) {
    try {
      const user = await this.findByUserid(userid);
      if (!user) {
        return null; // 사용자가 존재하지 않음
      }
      
      // 비밀번호 비교
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null; // 비밀번호가 일치하지 않음
      }
      
      // 인증 성공 - 비밀번호를 제외한 사용자 정보 반환
      console.log('Authenticated user data:', {
        userindex: user.userindex,
        userid: user.userid,
        name: user.name
      }); // 디버깅 로그 개선
      
      // 명시적으로 필요한 필드만 포함하여 반환
      return {
        userindex: user.userindex,
        userid: user.userid,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        phone: user.phone
      };
    } catch (error) {
      console.error('사용자 인증 오류:', error);
      throw error;
    }
  }
}

module.exports = User;
