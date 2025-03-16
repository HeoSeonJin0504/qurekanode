const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  saveRefreshToken, 
  verifyRefreshToken 
} = require('../utils/tokenUtil');

// 인증 컨트롤러
const authController = {
  /**
   * 토큰 갱신
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '리프레시 토큰이 제공되지 않았습니다.'
        });
      }
      
      console.log(`토큰 갱신 요청 - 처리 중`);
      
      // 리프레시 토큰 검증
      const payload = await verifyRefreshToken(refreshToken);
      
      if (!payload) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않거나 만료된 리프레시 토큰입니다.'
        });
      }
      
      console.log('토큰 검증 성공 - 사용자:', payload.userid);
      
      // 사용자 정보 조회
      const user = await User.findByUserid(payload.userid);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }
      
      // 새로운 액세스 토큰 생성
      const userInfo = {
        id: user.userindex,
        userid: user.userid,
        name: user.name
      };
      
      const accessToken = generateAccessToken(userInfo);
      console.log(`새 액세스 토큰 생성 완료`);
      
      return res.status(200).json({
        success: true,
        message: '액세스 토큰이 갱신되었습니다.',
        accessToken: accessToken,  // 명시적인 선언을 위해 축약 구문을 사용하지 않음
        user: {
          id: user.userindex,
          userid: user.userid,
          name: user.name
        }
      });
    } catch (error) {
      console.error('토큰 갱신 오류:', error.message);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 로그아웃 처리
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '리프레시 토큰이 제공되지 않았습니다.'
        });
      }
      
      // 리프레시 토큰 삭제
      await Token.deleteRefreshTokenByToken(refreshToken);
      
      return res.status(200).json({
        success: true,
        message: '로그아웃 되었습니다.'
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  }
};

module.exports = authController;
