const QuestionText = require('../models/questionTextModel');
const Question = require('../models/questionModel');
const User = require('../models/userModel');

const questionController = {
  /**
   * 새 문제 저장
   */
  async saveQuestion(req, res) {
    try {
      const { userId, fileName, questionType, questionText } = req.body;
      
      // 필수 입력값 검증
      if (!userId || !fileName || !questionType || !questionText) {
        return res.status(400).json({
          success: false,
          message: '필수 입력값이 누락되었습니다.'
        });
      }
      
      // 사용자 존재 여부 확인
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '존재하지 않는 사용자입니다.'
        });
      }
      
      console.log('MongoDB에 문제 텍스트 저장 시도:', { questionText: questionText.substring(0, 50) + '...' });
      
      // 1. MongoDB에 문제 텍스트만 저장
      try {
        const newQuestionText = new QuestionText({
          question_text: questionText
        });
        
        const savedQuestionText = await newQuestionText.save();
        console.log('MongoDB 저장 성공:', savedQuestionText._id);
        
        const mongoQuestionId = savedQuestionText._id.toString();
        
        // 2. MySQL에 문제 정보 저장
        const questionData = {
          userId,
          fileName,
          questionType,
          mongoQuestionId
        };
        
        const savedQuestion = await Question.create(questionData);
        
        return res.status(201).json({
          success: true,
          message: '문제가 성공적으로 저장되었습니다.',
          selection_id: savedQuestion.selection_id,
          mongo_question_id: mongoQuestionId
        });
      } catch (mongoError) {
        console.error('MongoDB 저장 오류:', mongoError);
        return res.status(500).json({
          success: false,
          message: 'MongoDB 저장 중 오류가 발생했습니다.',
          error: mongoError.message
        });
      }
    } catch (error) {
      console.error('문제 저장 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 사용자의 모든 문제 목록 조회
   */
  async getUserQuestions(req, res) {
    try {
      const userId = req.params.userId;
      const metadataOnly = req.metadataOnly === true;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '사용자 ID가 필요합니다.'
        });
      }
      
      // MySQL에서 문제 정보 목록 조회
      const questions = await Question.findByUserId(userId);
      
      if (questions.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          questions: []
        });
      }
      
      // 메타데이터만 요청한 경우 MongoDB 조회 없이 반환
      if (metadataOnly) {
        // 날짜 형식 포맷팅 추가
        const questionsWithFormattedDate = questions.map(question => {
          const createdAt = new Date(question.created_at);
          const formattedDate = createdAt.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          return {
            ...question,
            created_at: question.created_at, // 원본 ISO 형식 유지
            formatted_date: formattedDate,  // 사용자 친화적 형식 추가
          };
        });
        
        return res.status(200).json({
          success: true,
          count: questionsWithFormattedDate.length,
          questions: questionsWithFormattedDate
        });
      }
      
      // 전체 데이터 요청 시 MongoDB에서 각 문제 텍스트 조회하여 결합
      const questionsWithText = await Promise.all(
        questions.map(async (question) => {
          try {
            // MongoDB에서 문제 텍스트 조회
            const questionText = await QuestionText.findById(question.mongo_question_id);
            
            // 날짜 형식 포맷팅
            const createdAt = new Date(question.created_at);
            const formattedDate = createdAt.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return {
              ...question,
              created_at: question.created_at, // 원본 ISO 형식 유지
              formatted_date: formattedDate,  // 사용자 친화적 형식 추가
              question_text: questionText ? questionText.question_text : '문제 텍스트를 찾을 수 없습니다.'
            };
          } catch (error) {
            console.error(`문제 ID ${question.selection_id}의 텍스트 조회 오류:`, error);
            return {
              ...question,
              question_text: '문제 텍스트 로딩 중 오류가 발생했습니다.'
            };
          }
        })
      );
      
      return res.status(200).json({
        success: true,
        count: questionsWithText.length,
        questions: questionsWithText
      });
    } catch (error) {
      console.error('문제 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 특정 문제 상세 조회
   */
  async getQuestionDetail(req, res) {
    try {
      const { id } = req.params;
      
      // MySQL에서 문제 정보 조회
      const question = await Question.findById(id);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: '문제를 찾을 수 없습니다.'
        });
      }
      
      // MongoDB에서 문제 텍스트 조회
      const questionText = await QuestionText.findById(question.mongo_question_id);
      
      if (!questionText) {
        return res.status(404).json({
          success: false,
          message: '문제 텍스트를 찾을 수 없습니다.'
        });
      }
      
      return res.status(200).json({
        success: true,
        question: {
          ...question,
          question_text: questionText.question_text
        }
      });
    } catch (error) {
      console.error('문제 상세 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  }
  
  // 불필요한 getAllQuestionsMeta와 getQuestionMetaById 함수 제거
};

module.exports = questionController;
