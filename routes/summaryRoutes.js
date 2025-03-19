const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 요약 저장 API
router.post('/', verifyToken, summaryController.saveSummary);

// 사용자의 요약 목록 조회 API
router.get('/user/:userId', verifyToken, summaryController.getUserSummaries);

// 특정 요약 상세 조회 API
router.get('/:id', verifyToken, summaryController.getSummaryDetail);

module.exports = router;
