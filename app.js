const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectMongoDB } = require('./config/mongodb');
const summaryRoutes = require('./routes/summaryRoutes');
const questionRoutes = require('./routes/questionRoutes');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

// Express 앱 초기화
const app = express();

// CORS 옵션 구성 - 단순화
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === 'true';
    if (!origin || allowedOrigins.includes(origin) || allowAllOrigins) {
      callback(null, true);
    } else {
      logger.warn(`CORS 차단: ${origin}`);
      callback(new Error('CORS 정책에 의해 차단된 요청'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// 간소화된 요청 로깅 미들웨어
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// 데이터베이스 연결
testConnection();
connectMongoDB();

// API 라우트 (중복 제거하고 통합)
const apiRoutes = [
  { path: '/users', router: userRoutes },
  { path: '/auth', router: authRoutes },
  { path: '/summaries', router: summaryRoutes },
  { path: '/questions', router: questionRoutes }
];

// API 라우트 등록 (API 접두사 있는 버전과 없는 버전 모두 지원)
apiRoutes.forEach(route => {
  app.use(`/api${route.path}`, route.router);
  app.use(route.path, route.router);
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('회원가입 및 로그인 API 서버입니다.');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  logger.info(`API 서버 URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
  
  // 개발 환경에서만 허용된 CORS 도메인 출력 
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`CORS 허용 도메인: ${process.env.FRONTEND_URL || '모든 도메인 허용'}`);
  }
});
