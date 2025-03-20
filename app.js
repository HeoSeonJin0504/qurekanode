const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController'); // 추가
const { connectMongoDB } = require('./config/mongodb');
const summaryRoutes = require('./routes/summaryRoutes');

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
app.use('/api/summaries', summaryRoutes); // 요약 라우트 추가

// 직접 /api/logout 경로 추가 (프론트엔드 요청과 일치하도록)
app.post('/api/logout', authController.logout);

// 테스트 엔드포인트 (개발 완료 후 제거)
app.get('/api/test/summaries/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const SummaryModel = require('./models/summaryModel');
    const summaries = await SummaryModel.findByUserId(userId);
    
    return res.status(200).json({
      success: true,
      count: summaries.length,
      summaries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('회원가입 및 로그인 API 서버입니다.');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
