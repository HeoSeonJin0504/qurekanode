const jwt = require('jsonwebtoken');

/**
 * 액세스 토큰 검증 미들웨어
 */
const verifyToken = (req, res, next) => {
  // 헤더에서 토큰 가져오기
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('인증 헤더가 없거나 형식이 잘못됨');
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(`토큰 검증 성공 - 사용자: ${decoded.userid}`);
    
    // 검증된 사용자 정보를 요청 객체에 저장
    req.user = decoded;
    next();
  } catch (error) {
    console.log('토큰 검증 실패:', error.name);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.',
        expired: true
      });
    }
    
    return res.status(403).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};

module.exports = { verifyToken };
