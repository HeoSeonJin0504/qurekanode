const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 아이디 중복 확인 API
router.post('/check-userid', userController.checkUserid);

// 회원가입 API
router.post('/register', userController.register);

// 로그인 API
router.post('/login', userController.login);

module.exports = router;
