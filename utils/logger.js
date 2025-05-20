/**
 * 중앙 로깅 유틸리티
 * 로그 레벨에 따라 출력을 제어하고 일관된 형식을 적용합니다.
 */
const isProduction = process.env.NODE_ENV === 'production';

// 로그 레벨 정의
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 현재 로그 레벨 설정 (기본: 프로덕션에서는 INFO까지, 개발에서는 DEBUG까지)
const currentLogLevel = isProduction ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// 타임스탬프 형식 생성
const getTimestamp = () => {
  return new Date().toISOString();
};

// 로그 형식화
const formatLog = (level, message) => {
  return `[${getTimestamp()}] [${level}] ${message}`;
};

// 민감정보 마스킹 처리
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const maskedObj = { ...obj };
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
  
  sensitiveFields.forEach(field => {
    if (field in maskedObj) {
      maskedObj[field] = '********';
    }
  });
  
  return maskedObj;
};

// 객체를 문자열로 안전하게 변환
const safeStringify = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  
  try {
    return JSON.stringify(maskSensitiveData(obj));
  } catch (error) {
    return '[객체를 문자열로 변환할 수 없음]';
  }
};

// 로거 객체
const logger = {
  error: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message), data ? safeStringify(data) : '');
    }
  },
  
  warn: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message), data ? safeStringify(data) : '');
    }
  },
  
  info: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(formatLog('INFO', message), data ? safeStringify(data) : '');
    }
  },
  
  debug: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatLog('DEBUG', message), data ? safeStringify(data) : '');
    }
  },
  
  // 중요 트랜잭션 로깅 (항상 출력)
  transaction: (message, data) => {
    console.log(formatLog('TRANSACTION', message), data ? safeStringify(data) : '');
  }
};

module.exports = logger;
