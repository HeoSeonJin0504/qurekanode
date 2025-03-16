const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

// 아이디 중복 확인 API
router.post('/check-userid', userController.checkUserid);

// 회원가입 API
router.post('/register', userController.register);

// 로그인 API
router.post('/login', userController.login);

// 이미 authController의 verify 로직이 있으므로 해당 미들웨어를 재사용
router.get('/validate-token', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: '토큰이 유효합니다.',
    user: {
      id: req.user.id,
      userid: req.user.userid,
      name: req.user.name
      // ...existing fields...
    }
  });
});

// authController의 refreshToken 사용
router.post('/refresh-token', authController.refreshToken);

// 로그아웃 API 추가
router.post('/logout', authController.logout);

module.exports = router;
