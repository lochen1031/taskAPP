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

async function testSpecificChatRoom(token, taskId, userId) {
  try {
    console.log(`\n=== 测试特定聊天室 API: task=${taskId}, user=${userId} ===`);
    const response = await axios.get(`${API_BASE}/chat/room/${taskId}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 50 }
    });
    
    if (response.data.success) {
      console.log('✅ 聊天室消息API正常');
      console.log('消息数量:', response.data.data.messages.length);
      console.log('聊天室ID:', response.data.data.chatRoomId);
      return true;
    } else {
      console.log('❌ 聊天室消息API失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 聊天室消息API错误:', error.response?.data?.message || error.message);
    console.log('错误状态码:', error.response?.status);
    console.log('错误详情:', error.response?.data || error.message);
    return false;
  }
}

async function testTaskAPI(token, taskId) {
  try {
    console.log(`\n=== 测试任务API: ${taskId} ===`);
    const response = await axios.get(`${API_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ 任务API正常');
      console.log('任务标题:', response.data.data.title);
      return true;
    } else {
      console.log('❌ 任务API失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 任务API错误:', error.response?.data?.message || error.message);
    console.log('错误状态码:', error.response?.status);
    return false;
  }
}

async function testUserAPI(token, userId) {
  try {
    console.log(`\n=== 测试用户API: ${userId} ===`);
    const response = await axios.get(`${API_BASE}/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ 用户API正常');
      console.log('用户名:', response.data.data.username);
      return true;
    } else {
      console.log('❌ 用户API失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 用户API错误:', error.response?.data?.message || error.message);
    console.log('错误状态码:', error.response?.status);
    return false;
  }
}

async function runTest() {
  console.log('🚀 开始测试特定聊天室API...');
  
  // 1. 登录获取token
  const token = await login();
  if (!token) {
    console.log('❌ 无法获取有效token，测试终止');
    return;
  }
  
  // 测试一些可能的URL参数组合
  const testCases = [
    // 可能来自URL的参数
    { taskId: '6884aaec35e4bd09de1fe69c', userId: '6884ecc31c54750412993632' },
    { taskId: 'invalid_task_id', userId: '6884ecc31c54750412993632' },
    { taskId: '6884aaec35e4bd09de1fe69c', userId: 'invalid_user_id' },
    { taskId: 'invalid_task_id', userId: 'invalid_user_id' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n=== 测试用例: task=${testCase.taskId}, user=${testCase.userId} ===`);
    
    // 测试任务API
    const taskResult = await testTaskAPI(token, testCase.taskId);
    
    // 测试用户API
    const userResult = await testUserAPI(token, testCase.userId);
    
    // 测试聊天室API
    const chatResult = await testSpecificChatRoom(token, testCase.taskId, testCase.userId);
    
    console.log('结果汇总:');
    console.log('- 任务API:', taskResult ? '✅' : '❌');
    console.log('- 用户API:', userResult ? '✅' : '❌');
    console.log('- 聊天室API:', chatResult ? '✅' : '❌');
  }
}

runTest().catch(console.error);