const mongoose = require('mongoose');

// 문제 텍스트 스키마 - versionKey 비활성화
const questionTextSchema = new mongoose.Schema({
  question_text: {
    type: String,
    required: true
  }
}, {
  versionKey: false // __v 필드 제거
});

// 모델 생성 - 컬렉션 이름을 'generated_questions'로 명시적으로 지정
const QuestionText = mongoose.model('QuestionText', questionTextSchema, 'generated_questions');

module.exports = QuestionText;
