const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const SummaryText = require('../models/summaryTextModel');
const Summary = require('../models/summaryModel');
const { verifyToken } = require('../middlewares/authMiddleware');

// 요약 저장 API
router.post('/', verifyToken, summaryController.saveSummary);

// 사용자의 요약 목록 조회 API (모든 요약 텍스트 포함)
router.get('/user/:userId', verifyToken, summaryController.getUserSummaries);

// 사용자의 요약 목록 조회 API (요약 텍스트 없이 메타데이터만)
router.get('/user/:userId/meta', verifyToken, (req, res) => {
  req.metadataOnly = true;
  return summaryController.getUserSummaries(req, res);
});

// 특정 요약 상세 조회 API
router.get('/:id', verifyToken, summaryController.getSummaryDetail);

// 요약 검색 API (파일명이나 유형으로 검색)
router.get('/search/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, type } = req.query;
    
    // 검색 조건 구성
    const searchCriteria = {
      userId: parseInt(userId, 10)
    };
    
    // 검색어가 있으면 파일명 검색 조건 추가
    if (query) {
      searchCriteria.searchQuery = query;
    }
    
    // 요약 유형이 있으면 필터 조건 추가
    if (type && ['기본 요약', '핵심 요약', '주제 요약', '목차 요약', '키워드 요약'].includes(type)) {
      searchCriteria.summaryType = type;
    }
    
    // 검색 실행
    const searchResults = await Summary.searchSummaries(searchCriteria);
    
    // 검색 결과에 요약 텍스트 추가
    const resultsWithText = await Promise.all(
      searchResults.map(async (item) => {
        const summaryText = await SummaryText.findById(item.mongo_summary_id);
        return {
          ...item,
          summary_text: summaryText ? summaryText.summary_text : '요약 텍스트를 찾을 수 없습니다.'
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      count: resultsWithText.length,
      summaries: resultsWithText
    });
  } catch (error) {
    console.error('요약 검색 오류:', error);
    return res.status(500).json({
      success: false,
      message: '요약 검색 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
