/**
 * 날짜를 사용자 친화적인 형식으로 변환
 * @param {Date|string} date - 변환할 날짜
 * @param {string} locale - 로케일 (기본값: 'ko-KR')
 * @returns {string} 포맷된 날짜 문자열
 */
const formatDate = (date, locale = 'ko-KR') => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 요약 텍스트를 미리보기 형식으로 변환
 * @param {string} text - 요약 텍스트
 * @param {number} maxLength - 최대 길이 (기본값: 100)
 * @returns {string} 미리보기 텍스트
 */
const getTextPreview = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

module.exports = {
  formatDate,
  getTextPreview
};
