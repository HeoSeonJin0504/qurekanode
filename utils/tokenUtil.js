const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Token = require('../models/tokenModel');
const logger = require('./logger');

/**
 * 액세스 토큰 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} 생성된 액세스 토큰
 */
const generateAccessToken = (payload) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '1h';
  logger.debug(`액세스 토큰 생성 - 사용자: ${payload.userid}`);
  
  const tokenPayload = {
    ...payload,
    iss: process.env.BACKEND_URL  // 환경 변수에서 백엔드 URL 가져옴
  };
  
  return jwt.sign(
    tokenPayload,
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
  logger.debug(`리프레시 토큰 생성 - 사용자: ${payload.userid}`);
  
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
    logger.error('리프레시 토큰 저장 실패 - 유효하지 않은 사용자 ID');
    throw new Error('유효한 사용자 ID가 제공되지 않았습니다.');
  }
  
  if (!token) {
    throw new Error('토큰이 제공되지 않았습니다.');
  }
  
  // JWT decode하여 만료 시간 가져오기
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    throw new Error('토큰 형식이 올바르지 않습니다.');
  }
  
  const expiresAt = new Date(decoded.exp * 1000); // JWT exp는 초 단위이므로 밀리초로 변환
  
  try {
    // 토큰을 bcrypt 해시
    const hashedToken = await bcrypt.hash(token, 10);
    
    // 데이터베이스에 해시된 토큰 저장
    const result = await Token.saveRefreshToken(userId, hashedToken, expiresAt);
    logger.debug(`리프레시 토큰 저장 완료 - 사용자 ID: ${userId}`);
    return result;
  } catch (error) {
    logger.error('리프레시 토큰 저장 실패', error);
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

/**
 * HTTP 응답에 토큰을 쿠키와 JSON으로 설정
 * @param {Object} res - Express 응답 객체
 * @param {string} accessToken - 액세스 토큰
 * @param {string} refreshToken - 리프레시 토큰
 * @param {boolean} rememberMe - 자동 로그인 여부
 */
const setTokenCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 기본 쿠키 옵션
  const cookieOptions = {
    httpOnly: true,                // 브라우저 JS에서 접근 불가능
    secure: isProduction,          // HTTPS에서만 전송 (프로덕션에서)
    sameSite: isProduction ? 'none' : 'lax',  // CORS 요청 시 쿠키 전송 제어
    path: '/'                      // 모든 경로에서 접근 가능
  };
  
  // 액세스 토큰 쿠키 옵션
  const accessTokenCookieOptions = {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000 // 1시간 (액세스 토큰)
  };
  
  // 리프레시 토큰 쿠키 옵션 - 자동 로그인 설정에 따라 달라짐
  const refreshTokenCookieOptions = {
    ...cookieOptions,
    // 자동 로그인 시 만료기간 설정, 아닐 경우 세션 쿠키로 설정
    ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}) // 7일 (리프레시 토큰)
  };
  
  // 쿠키에 토큰 저장
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
  
  // 자동 로그인 상태 저장
  res.cookie('rememberMe', rememberMe, {
    httpOnly: false, // 클라이언트 JS에서 접근 가능하도록
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}) // 자동 로그인 시에만 만료 기간 설정
  });
  
  logger.debug(`토큰이 쿠키에 설정되었습니다. 자동 로그인: ${rememberMe ? '사용' : '미사용'}`);
};

/**
 * 토큰을 다양한 위치에서 추출
 * @param {Object} req - Express 요청 객체
 * @param {string} tokenName - 'accessToken' 또는 'refreshToken'
 * @returns {string|null} 추출된 토큰 또는 null
 */
const extractToken = (req, tokenName) => {
  // 1. Authorization 헤더에서 추출
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && tokenName === 'accessToken') {
    return authHeader.split(' ')[1];
  }
  
  // 2. 쿠키에서 추출
  if (req.cookies && req.cookies[tokenName]) {
    return req.cookies[tokenName];
  }
  
  // 3. 요청 본문에서 추출
  if (req.body && req.body[tokenName]) {
    return req.body[tokenName];
  }
  
  return null;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  extractToken
};
