const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 토큰 갱신 API
router.post('/refresh-token', authController.refreshToken);

// 로그아웃 API
router.post('/logout', authController.logout);

// 토큰 검증 API (테스트용)
router.get('/verify', verifyToken, (req, res) => {
  // 명시적으로 success: true를 포함시키고 user 객체 전체를 반환
  res.status(200).json({
    success: true,
    message: '토큰이 유효합니다.',
    user: {
      id: req.user.id,
      userid: req.user.userid,
      name: req.user.name,
      // 필요한 경우 추가 사용자 정보를 포함할 수 있음
    }
  });
});

module.exports = router;
