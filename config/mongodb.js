const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB 연결 설정
const connectMongoDB = async () => {
  try {
    // 몽고DB 연결 URL 로깅 (비밀번호는 가려서)
    const mongoUriForLogging = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':***@')
      : 'MongoDB URL이 설정되지 않음';
    
    console.log('MongoDB 연결 시도:', mongoUriForLogging);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
    });
    
    console.log('MongoDB 데이터베이스 연결 성공');
    
    // 연결된 데이터베이스 정보 출력
    const db = mongoose.connection;
    console.log(`연결된 MongoDB 데이터베이스: ${db.name}`);
    
    // 컬렉션 목록 확인
    const collections = await db.db.listCollections().toArray();
    console.log('사용 가능한 컬렉션 목록:', collections.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = { connectMongoDB };
