const axios = require('axios');

// 设置axios基础URL
axios.defaults.baseURL = 'http://localhost:5000/api';

async function createTestUser2() {
  try {
    console.log('创建第二个测试用户...');
    
    const userData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123',
      university: '测试大学',
      major: '计算机科学',
      grade: '大三'
    };
    
    const response = await axios.post('/auth/register', userData);
    
    if (response.data.success) {
      console.log('✅ 第二个测试用户创建成功!');
      console.log('用户名:', userData.username);
      console.log('邮箱:', userData.email);
      console.log('密码:', userData.password);
      console.log('Token:', response.data.token);
    } else {
      console.log('❌ 用户创建失败:', response.data.message);
    }
  } catch (error) {
    console.error('创建用户时发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

createTestUser2();