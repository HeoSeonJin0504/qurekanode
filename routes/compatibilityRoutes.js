const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 레거시 로그아웃 API 호환성 유지
router.post('/logout', authController.logout);

module.exports = router;
