const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');

// MongoDB 연결 설정
const connectMongoDB = async () => {
  try {
    // 몽고DB 연결 URL 로깅 (비밀번호는 가려서)
    const mongoUriForLogging = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':***@')
      : 'MongoDB URL이 설정되지 않음';
    
    logger.info('MongoDB 연결 시도');
    logger.debug('MongoDB URI', { uri: mongoUriForLogging });
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info('MongoDB 데이터베이스 연결 성공');
    
    // 개발 환경에서만 상세 정보 출력
    if (process.env.NODE_ENV !== 'production') {
      // 연결된 데이터베이스 정보 출력
      const db = mongoose.connection;
      logger.debug(`MongoDB 데이터베이스: ${db.name}`);
      
      const collections = await db.db.listCollections().toArray();
      logger.debug(`컬렉션 목록: ${collections.map(c => c.name).join(', ')}`);
    }
  } catch (error) {
    logger.error('MongoDB 연결 실패', error);
    process.exit(1);
  }
};

module.exports = { connectMongoDB };
