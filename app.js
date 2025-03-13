const express = require('express');
const cors = require('cors');  // CORS 미들웨어 추가
const { testConnection } = require('./config/db');
const userRoutes = require('./routes/userRoutes');

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(cors());  // CORS 활성화
app.use(express.json()); // JSON 요청 본문 파싱

// 데이터베이스 연결 테스트
testConnection();

// 라우트 설정
app.use('/api/users', userRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('회원가입 및 로그인 API 서버입니다.');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
