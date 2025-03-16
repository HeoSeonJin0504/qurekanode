const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Token = require('../models/tokenModel');

/**
 * 액세스 토큰 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} 생성된 액세스 토큰
 */
const generateAccessToken = (payload) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '1h';
  // 민감한 정보 로깅 제거
  console.log(`액세스 토큰 생성 - 사용자: ${payload.userid}, 만료 시간: ${expiresIn}`);
  
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: expiresIn }
  );
};

/**
 * 리프레시 토큰 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} 생성된 리프레시 토큰
 */
const generateRefreshToken = (payload) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  // 민감한 정보 로깅 제거
  console.log(`리프레시 토큰 생성 - 사용자: ${payload.userid}, 만료 시간: ${expiresIn}`);
  
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: expiresIn }
  );
};

/**
 * 리프레시 토큰 저장
 * @param {number} userId - 사용자 ID
 * @param {string} token - 리프레시 토큰
 * @returns {Object} 저장된 토큰 정보
 */
const saveRefreshToken = async (userId, token) => {
  // 파라미터 검증
  if (userId === undefined || userId === null) {
    console.error('saveRefreshToken - 유효하지 않은 사용자 ID');
    throw new Error('유효한 사용자 ID가 제공되지 않았습니다.');
  }
  
  if (!token) {
    throw new Error('토큰이 제공되지 않았습니다.');
  }
  
  console.log(`리프레시 토큰 저장 시도 - 사용자 ID: ${userId}`);
  
  // JWT decode하여 만료 시간 가져오기
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    throw new Error('토큰 형식이 올바르지 않습니다.');
  }
  
  const expiresAt = new Date(decoded.exp * 1000); // JWT exp는 초 단위이므로 밀리초로 변환
  console.log(`토큰 저장 - 사용자 ID: ${userId}, 만료시간: ${expiresAt}`);
  
  try {
    // 토큰을 bcrypt 해시
    const hashedToken = await bcrypt.hash(token, 10);
    
    // 데이터베이스에 해시된 토큰 저장
    const result = await Token.saveRefreshToken(userId, hashedToken, expiresAt);
    console.log(`토큰 저장 완료 - ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    throw error;
  }
};

/**
 * 리프레시 토큰 검증
 * @param {string} token - 검증할 리프레시 토큰
 * @returns {Object|null} 검증된 페이로드 또는 null
 */
const verifyRefreshToken = async (plainToken) => {
  try {
    // 데이터베이스에서 토큰 조회
    const tokenRecord = await Token.findRefreshToken(plainToken);
    if (!tokenRecord) {
      return null;
    }
    
    // 토큰 만료 확인
    const now = new Date();
    if (now > new Date(tokenRecord.expires_at)) {
      await Token.deleteRefreshTokenByToken(plainToken);
      return null;
    }
    
    // 해시 비교
    const isMatch = await bcrypt.compare(plainToken, tokenRecord.token);
    if (!isMatch) {
      return null;
    }
    
    // JWT 검증
    const decoded = jwt.verify(plainToken, process.env.REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken
};
