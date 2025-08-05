const axios = require('axios');
const io = require('socket.io-client');

// 测试用户信息
const testUser = {
  email: 'testimage@example.com',
  password: 'password123'
};

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// 登录函数
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testUser);
    if (response.data.success) {
      console.log('✅ 登录成功');
      return {
        token: response.data.token,
        userId: response.data.user._id,
        username: response.data.user.username
      };
    }
  } catch (error) {
    console.log('❌ 登录失败:', error.response?.data?.message || error.message);
    return null;
  }
}

// 获取任务
async function getTask(token) {
  try {
    const response = await axios.get(`${API_BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const tasks = response.data.data?.tasks || [];
    if (tasks.length > 0) {
      console.log('✅ 获取任务成功:', tasks[0].title);
      return tasks[0];
    }
    return null;
  } catch (error) {
    console.log('❌ 获取任务失败:', error.response?.data?.message || error.message);
    return null;
  }
}

// 测试消息发送修复
async function testMessageSendFix() {
  console.log('🚀 开始测试消息发送修复...');
  
  try {
    // 1. 登录
    const auth = await login();
    if (!auth) {
      console.log('❌ 测试终止：登录失败');
      return;
    }
    
    // 2. 获取任务
    const task = await getTask(auth.token);
    if (!task) {
      console.log('❌ 测试终止：获取任务失败');
      return;
    }
    
    // 3. 创建Socket连接
    console.log('\n📡 创建Socket连接...');
    const socket = io(SOCKET_URL, {
      auth: {
        userId: auth.userId,
        username: auth.username
      }
    });
    
    // 等待连接
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('✅ Socket连接成功:', socket.id);
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.log('❌ Socket连接失败:', error.message);
        reject(error);
      });
      
      setTimeout(() => {
        reject(new Error('连接超时'));
      }, 5000);
    });
    
    // 4. 监听消息接收
    socket.on('receive_message', (data) => {
      console.log('📨 收到Socket消息:', {
        content: data.content,
        senderId: data.senderId,
        roomId: data.roomId,
        timestamp: data.timestamp
      });
    });
    
    // 5. 加入聊天室
    const receiverId = task.publisher._id;
    const roomId = `${task._id}_${auth.userId}_${receiverId}`;
    console.log('\n🏠 加入聊天室:', roomId);
    socket.emit('join_room', roomId);
    
    // 等待加入成功
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. 测试API发送消息
    console.log('\n📤 测试API发送消息...');
    const messageData = {
      taskId: task._id,
      receiverId: receiverId,
      content: '测试修复后的消息发送 - ' + new Date().toLocaleTimeString(),
      messageType: 'text'
    };
    
    const apiResponse = await axios.post(`${API_BASE}/chat/send`, messageData, {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    });
    
    if (apiResponse.data.success) {
      console.log('✅ API发送消息成功');
      
      // 7. 测试Socket发送消息
      console.log('\n🔄 测试Socket发送消息...');
      socket.emit('send_message', {
        ...messageData,
        content: 'Socket测试消息 - ' + new Date().toLocaleTimeString()
      });
      
      console.log('✅ Socket消息已发送');
      
    } else {
      console.log('❌ API发送消息失败:', apiResponse.data.message);
    }
    
    // 8. 等待观察结果
    console.log('\n⏳ 等待消息处理...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 关闭连接
    socket.disconnect();
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testMessageSendFix();