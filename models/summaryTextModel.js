const mongoose = require('mongoose');

// 요약 텍스트 스키마 - created_at 필드 제거 및 versionKey 비활성화
const summaryTextSchema = new mongoose.Schema({
  summary_text: {
    type: String,
    required: true
  }
}, {
  versionKey: false // __v 필드 제거
  // created_at 필드 제거 - 명시적으로 timestamps 옵션 사용하지 않음
});

// 정적 메서드 추가: ID로 요약 텍스트 삭제
summaryTextSchema.statics.deleteById = async function(id) {
  try {
    const result = await this.deleteOne({ _id: id });
    return result.deletedCount > 0;
  } catch (error) {
    throw error;
  }
};

// 모델 생성 - 컬렉션 이름을 'summaries'로 명시적으로 지정
const SummaryText = mongoose.model('SummaryText', summaryTextSchema, 'summaries');

module.exports = SummaryText;
