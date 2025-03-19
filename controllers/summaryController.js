const SummaryText = require('../models/summaryTextModel');
const Summary = require('../models/summaryModel');
const User = require('../models/userModel');

const summaryController = {
  /**
   * 새 요약 저장
   */
  async saveSummary(req, res) {
    try {
      const { userId, fileName, summaryType, summaryText } = req.body;
      
      // 필수 입력값 검증
      if (!userId || !fileName || !summaryType || !summaryText) {
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
      
      console.log('MongoDB에 요약 텍스트 저장 시도:', { summaryText: summaryText.substring(0, 50) + '...' });
      
      // 1. MongoDB에 요약 텍스트만 저장 (created_at, __v 없음)
      try {
        const newSummaryText = new SummaryText({
          summary_text: summaryText
          // created_at 필드 제거됨
        });
        
        const savedSummaryText = await newSummaryText.save();
        console.log('MongoDB 저장 성공:', savedSummaryText._id);
        
        const mongoSummaryId = savedSummaryText._id.toString();
        
        // 2. MySQL에 요약 정보 저장
        const summaryData = {
          userId,
          fileName,
          summaryType,
          mongoSummaryId
        };
        
        const savedSummary = await Summary.create(summaryData);
        
        return res.status(201).json({
          success: true,
          message: '요약이 성공적으로 저장되었습니다.',
          selection_id: savedSummary.selection_id,
          mongo_summary_id: mongoSummaryId
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
      console.error('요약 저장 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 사용자의 모든 요약 목록 조회
   */
  async getUserSummaries(req, res) {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '사용자 ID가 필요합니다.'
        });
      }
      
      const summaries = await Summary.findByUserId(userId);
      
      return res.status(200).json({
        success: true,
        count: summaries.length,
        summaries
      });
    } catch (error) {
      console.error('요약 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 특정 요약 상세 조회
   */
  async getSummaryDetail(req, res) {
    try {
      const { id } = req.params;
      
      // MySQL에서 요약 정보 조회
      const summary = await Summary.findById(id);
      
      if (!summary) {
        return res.status(404).json({
          success: false,
          message: '요약을 찾을 수 없습니다.'
        });
      }
      
      // MongoDB에서 요약 텍스트 조회
      const summaryText = await SummaryText.findById(summary.mongo_summary_id);
      
      if (!summaryText) {
        return res.status(404).json({
          success: false,
          message: '요약 텍스트를 찾을 수 없습니다.'
        });
      }
      
      return res.status(200).json({
        success: true,
        summary: {
          ...summary,
          summary_text: summaryText.summary_text
        }
      });
    } catch (error) {
      console.error('요약 상세 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  }
};

module.exports = summaryController;
