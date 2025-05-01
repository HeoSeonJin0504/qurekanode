const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectMongoDB } = require('./config/mongodb');
const summaryRoutes = require('./routes/summaryRoutes');
const questionRoutes = require('./routes/questionRoutes');
// 중복 API 제거
// const problemSummaryMetaRoutes = require('./routes/problemSummaryMeta');

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 데이터베이스 연결 테스트
testConnection();
connectMongoDB(); // MongoDB 연결 추가

// 라우트 설정
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/questions', questionRoutes);
// 중복 API 제거
// app.use('/api/problem-summary-meta', problemSummaryMetaRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('회원가입 및 로그인 API 서버입니다.');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
