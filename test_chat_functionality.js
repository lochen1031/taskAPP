const axios = require('axios');
const io = require('socket.io-client');

// 配置
const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// 测试用户凭据（需要先登录获取token）
const testUser1 = {
  email: 'testimage@example.com',
  password: 'password123'
};

const testUser2 = {
  email: 'test2@example.com', 
  password: 'password123'
};

let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';
let testTaskId = '';

// 登录函数
async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    if (response.data.success) {
      return {
        token: response.data.token,
        userId: response.data.user._id
      };
    }
    throw new Error('登录失败');
  } catch (error) {
    console.error('登录错误:', error.response?.data?.message || error.message);
    return null;
  }
}

// 获取任务列表
async function getTasks() {
  try {
    // 直接使用我们设置权限的任务ID
    return '6884aaec35e4bd09de1fe69c';
  } catch (error) {
    console.error('获取任务失败:', error.response?.data?.message || error.message);
    return null;
  }
}

// 测试聊天室API
async function testChatRoomAPI(taskId, userId, token) {
  try {
    console.log('\n=== 测试聊天室API ===');
    const response = await axios.get(`${API_BASE}/chat/room/${taskId}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ 聊天室API正常');
      console.log('聊天室ID:', response.data.data.chatRoomId);
      console.log('消息数量:', response.data.data.messages.length);
      return true;
    } else {
      console.log('❌ 聊天室API失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 聊天室API错误:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试发送消息API
async function testSendMessageAPI(taskId, receiverId, token) {
  try {
    console.log('\n=== 测试发送消息API ===');
    const messageData = {
      taskId: taskId,
      receiverId: receiverId,
      content: '这是一条测试消息 - ' + new Date().toLocaleTimeString(),
      messageType: 'text'
    };
    
    const response = await axios.post(`${API_BASE}/chat/send`, messageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ 发送消息API正常');
      console.log('消息内容:', response.data.data.content);
      return response.data.data;
    } else {
      console.log('❌ 发送消息API失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 发送消息API错误:', error.response?.data?.message || error.message);
    return null;
  }
}

// 测试Socket.IO连接
function testSocketConnection(token, userId) {
  return new Promise((resolve) => {
    console.log('\n=== 测试Socket.IO连接 ===');
    
    const socket = io(SOCKET_URL, {
      auth: {
        userId: userId,
        token: token
      }
    });
    
    let connected = false;
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO连接成功');
      connected = true;
      
      // 测试加入聊天室
      const roomId = `${testTaskId}_${user1Id}_${user2Id}`;
      socket.emit('join_room', roomId);
      console.log('📨 已发送加入聊天室请求:', roomId);
      
      setTimeout(() => {
        socket.disconnect();
        resolve(connected);
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO连接失败:', error.message);
      resolve(false);
    });
    
    socket.on('receive_message', (data) => {
      console.log('📨 收到消息:', data.content);
    });
    
    // 超时处理
    setTimeout(() => {
      if (!connected) {
        console.log('❌ Socket.IO连接超时');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// 主测试函数
async function runChatTests() {
  console.log('🚀 开始聊天功能测试...');
  
  // 1. 登录测试用户
  console.log('\n=== 用户登录测试 ===');
  const user1Auth = await login(testUser1);
  if (!user1Auth) {
    console.log('❌ 用户1登录失败，测试终止');
    return;
  }
  user1Token = user1Auth.token;
  user1Id = user1Auth.userId;
  console.log('✅ 用户1登录成功:', user1Id);
  
  const user2Auth = await login(testUser2);
  if (!user2Auth) {
    console.log('❌ 用户2登录失败，测试终止');
    return;
  }
  user2Token = user2Auth.token;
  user2Id = user2Auth.userId;
  console.log('✅ 用户2登录成功:', user2Id);
  
  // 2. 获取测试任务
  console.log('\n=== 获取测试任务 ===');
  testTaskId = await getTasks();
  if (!testTaskId) {
    console.log('❌ 获取任务失败，测试终止');
    return;
  }
  console.log('✅ 获取测试任务成功:', testTaskId);
  
  // 3. 测试聊天室API
  const chatRoomTest = await testChatRoomAPI(testTaskId, user2Id, user1Token);
  
  // 4. 测试发送消息API
  const sendMessageTest = await testSendMessageAPI(testTaskId, user2Id, user1Token);
  
  // 5. 测试Socket.IO连接
  const socketTest = await testSocketConnection(user1Token, user1Id);
  
  // 6. 总结测试结果
  console.log('\n=== 测试结果总结 ===');
  console.log('聊天室API:', chatRoomTest ? '✅ 通过' : '❌ 失败');
  console.log('发送消息API:', sendMessageTest ? '✅ 通过' : '❌ 失败');
  console.log('Socket.IO连接:', socketTest ? '✅ 通过' : '❌ 失败');
  
  const allPassed = chatRoomTest && sendMessageTest && socketTest;
  console.log('\n整体测试结果:', allPassed ? '✅ 全部通过' : '❌ 存在问题');
  
  if (allPassed) {
    console.log('🎉 聊天功能修复成功！用户现在可以正常使用聊天功能了。');
  } else {
    console.log('⚠️  聊天功能仍存在问题，需要进一步排查。');
  }
}

// 运行测试
runChatTests().catch(console.error);