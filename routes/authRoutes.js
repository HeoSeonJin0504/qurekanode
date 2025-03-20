const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 토큰 갱신 API
router.post('/refresh-token', authController.refreshToken);

// 로그아웃 API
router.post('/logout', authController.logout);

// 토큰 검증 API
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: '토큰이 유효합니다.',
    user: {
      id: req.user.id,
      userid: req.user.userid,
      name: req.user.name
    }
  });
});

module.exports = router;
