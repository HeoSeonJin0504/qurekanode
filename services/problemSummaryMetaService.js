const Question = require('../models/questionModel');

exports.getAllProblemSummaryMeta = async () => {
  try {
    // Question 모델을 사용하여 메타 데이터만 조회
    const questions = await Question.findAll();
    
    // 메타데이터로 필터링하여 반환
    const problemMetas = questions.map(question => ({
      id: question.selection_id,
      title: question.file_name,
      difficulty: question.question_type,
      category: question.question_type,
      createdAt: question.created_at,
      updatedAt: question.updated_at || question.created_at
    }));
    
    return problemMetas;
  } catch (error) {
    console.error('Error in getAllProblemSummaryMeta service:', error);
    throw error;
  }
};

exports.getProblemSummaryMetaById = async (id) => {
  try {
    // Question 모델을 사용하여 특정 ID의 문제 메타데이터 조회
    const question = await Question.findById(id);
    
    if (!question) {
      return null;
    }
    
    // 메타데이터 형식으로 변환
    const problemMeta = {
      id: question.selection_id,
      title: question.file_name,
      difficulty: question.question_type,
      category: question.question_type,
      createdAt: question.created_at,
      updatedAt: question.updated_at || question.created_at
    };
    
    return problemMeta;
  } catch (error) {
    console.error(`Error in getProblemSummaryMetaById service for id ${id}:`, error);
    throw error;
  }
};
