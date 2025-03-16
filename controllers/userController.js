const User = require('../models/userModel');
const { generateAccessToken, generateRefreshToken, saveRefreshToken } = require('../utils/tokenUtil');

// 사용자 컨트롤러
const userController = {
  /**
   * 아이디 중복 확인
   */
  async checkUserid(req, res) {
    try {
      const { userid } = req.body;
      
      if (!userid) {
        return res.status(400).json({
          success: false,
          message: '아이디가 제공되지 않았습니다.'
        });
      }
      
      // 사용자 아이디로 조회
      const existingUser = await User.findByUserid(userid);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 아이디입니다.'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '사용 가능한 아이디입니다.'
      });
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 회원가입 처리
   */
  async register(req, res) {
    try {
      const { userid, password, name, age, gender, phone, email } = req.body;
      
      // 필수 입력값 검증
      if (!userid || !password || !name || !age || !gender || !phone) {
        return res.status(400).json({
          success: false,
          message: '필수 입력값이 누락되었습니다. (아이디, 비밀번호, 이름, 나이, 성별, 전화번호는 필수입니다.)'
        });
      }
      
      // 아이디 중복 확인
      const existingUser = await User.findByUserid(userid);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 아이디입니다.'
        });
      }
      
      // 사용자 생성
      const newUser = await User.create({ 
        userid, 
        password, 
        name, 
        age, 
        gender, 
        phone, 
        email 
      });
      
      return res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: {
          id: newUser.userindex,
          userid: newUser.userid,
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      // 중복 키 오류 처리
      if (error.code === 'ER_DUP_ENTRY') {
        let message = '이미 등록된 정보입니다.';
        if (error.sqlMessage.includes('phone')) {
          message = '이미 등록된 전화번호입니다.';
        } else if (error.sqlMessage.includes('email')) {
          message = '이미 등록된 이메일입니다.';
        } else if (error.sqlMessage.includes('userid')) {
          message = '이미 등록된 아이디입니다.';
        }
        
        return res.status(409).json({
          success: false,
          message: message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  },
  
  /**
   * 로그인 처리
   */
  async login(req, res) {
    try {
      const { userid, password } = req.body;
      
      // 필수 입력값 검증
      if (!userid || !password) {
        return res.status(400).json({
          success: false,
          message: '아이디와 비밀번호를 모두 입력해주세요.'
        });
      }
      
      // 인증 시도
      const user = await User.authenticate(userid, password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '아이디 또는 비밀번호가 일치하지 않습니다.'
        });
      }
      
      console.log('로그인 성공 - 사용자:', user.userid);
      
      // 사용자 ID가 제대로 있는지 확인
      if (user.userindex === undefined || user.userindex === null) {
        console.error('사용자 ID(userindex)값이 없음');
        return res.status(500).json({
          success: false,
          message: '사용자 ID 정보가 올바르지 않습니다.'
        });
      }
      
      // 토큰에 담을 사용자 정보
      const userInfo = {
        id: user.userindex,
        userid: user.userid,
        name: user.name
      };
      
      // 액세스 토큰 및 리프레시 토큰 생성
      const accessToken = generateAccessToken(userInfo);
      const refreshToken = generateRefreshToken(userInfo);
      
      console.log(`토큰 생성 완료 - 사용자: ${user.userid}`);
      
      try {
        // 리프레시 토큰 저장
        console.log(`리프레시 토큰 저장 시도 - 사용자 ID: ${user.userindex}`);
        await saveRefreshToken(user.userindex, refreshToken);
        console.log('리프레시 토큰 저장 성공');
      } catch (tokenError) {
        console.error('리프레시 토큰 저장 실패:', tokenError.message);
        return res.status(500).json({
          success: false,
          message: '로그인은 성공했으나 토큰 저장 중 오류가 발생했습니다.'
        });
      }
      
      // 로그인 성공
      return res.status(200).json({
        success: true,
        message: '로그인 성공',
        user: {
          id: user.userindex,
          userid: user.userid,
          name: user.name,
          email: user.email
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('로그인 오류:', error.message);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  }
};

module.exports = userController;
