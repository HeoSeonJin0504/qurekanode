const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 문제 저장 API
router.post('/', verifyToken, questionController.saveQuestion);

// 사용자의 문제 목록 조회 API
router.get('/user/:userId', verifyToken, questionController.getUserQuestions);

// 특정 문제 상세 조회 API
router.get('/:id', verifyToken, questionController.getQuestionDetail);

// 문제 검색 API (파일명이나 유형으로 검색)
router.get('/search/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, type } = req.query;
    const Question = require('../models/questionModel');
    const QuestionText = require('../models/questionTextModel');
    
    // 검색 조건 구성
    const searchCriteria = {
      userId: parseInt(userId, 10)
    };
    
    // 검색어가 있으면 파일명 검색 조건 추가
    if (query) {
      searchCriteria.searchQuery = query;
    }
    
    // 문제 유형이 있으면 필터 조건 추가
    if (type && ['n지 선다형', '순서 배열형', '참/거짓', '빈칸 채우기', '단답형', '서술형'].includes(type)) {
      searchCriteria.questionType = type;
    }
    
    // 검색 실행
    const searchResults = await Question.searchQuestions(searchCriteria);
    
    // 검색 결과에 문제 텍스트 추가
    const resultsWithText = await Promise.all(
      searchResults.map(async (item) => {
        const questionText = await QuestionText.findById(item.mongo_question_id);
        return {
          ...item,
          question_text: questionText ? questionText.question_text : '문제 텍스트를 찾을 수 없습니다.'
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      count: resultsWithText.length,
      questions: resultsWithText
    });
  } catch (error) {
    console.error('문제 검색 오류:', error);
    return res.status(500).json({
      success: false,
      message: '문제 검색 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
