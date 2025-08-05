const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// 测试用户凭据
const testUser = {
  email: 'testimage@example.com',
  password: 'password123'
};

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testUser);
    if (response.data.success) {
      console.log('✅ 登录成功');
      return response.data.token;
    } else {
      console.log('❌ 登录失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 登录错误:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testChatRoomsAPI(token) {
  try {
    console.log('\n=== 测试获取聊天室列表API ===');
    const response = await axios.get(`${API_BASE}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ 聊天室API正常');
      console.log('聊天室数量:', response.data.data.length);
      console.log('聊天室列表:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.log('❌ 聊天室API失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 聊天室API错误:', error.response?.data?.message || error.message);
    console.log('错误详情:', error.response?.data || error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 开始测试聊天室API...');
  
  // 1. 登录获取token
  const token = await login();
  if (!token) {
    console.log('❌ 无法获取有效token，测试终止');
    return;
  }
  
  // 2. 测试聊天室API
  const result = await testChatRoomsAPI(token);
  
  console.log('\n=== 测试结果 ===');
  console.log('聊天室API:', result ? '✅ 通过' : '❌ 失败');
}

runTest().catch(console.error);