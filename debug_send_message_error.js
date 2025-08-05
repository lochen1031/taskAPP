// 调试"發送消息失敗"错误的专用脚本
const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// 测试用户凭据
const testCredentials = {
  email: 'demo@example.com',
  password: '123456'
};

async function debugSendMessageError() {
  console.log('=== 调试"發送消息失敗"错误 ===\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testCredentials);
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const loginData = loginResponse.data;
    if (!loginData.success) {
      console.log('❌ 登录失败:', loginData.message);
      return;
    }
    
    const { token, user } = loginData.data || loginData;
    console.log('✅ 登录成功, 用户:', user.username || user.email);
    
    // 设置axios默认headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. 获取聊天室列表
    console.log('\n2. 获取聊天室列表...');
    const roomsResponse = await axios.get(`${API_BASE}/chat/rooms`);
    
    if (!roomsResponse.data.success) {
      console.log('❌ 获取聊天室失败:', roomsResponse.data.message);
      return;
    }
    
    const chatRooms = roomsResponse.data.data;
    console.log(`✅ 获取到 ${chatRooms.length} 个聊天室`);
    
    if (chatRooms.length === 0) {
      console.log('⚠️  没有聊天室，无法测试发送消息');
      return;
    }
    
    // 3. 选择第一个聊天室进行测试
    const testRoom = chatRooms[0];
    console.log('\n3. 测试聊天室信息:');
    console.log('- 任务ID:', testRoom.task?._id);
    console.log('- 任务标题:', testRoom.task?.title);
    console.log('- 对方用户ID:', testRoom.otherUser?._id);
    console.log('- 对方用户名:', testRoom.otherUser?.username);
    
    if (!testRoom.task?._id || !testRoom.otherUser?._id) {
      console.log('❌ 聊天室数据不完整，无法测试');
      return;
    }
    
    // 4. 测试发送消息API
    console.log('\n4. 测试发送消息API...');
    const messageData = {
      taskId: testRoom.task._id,
      receiverId: testRoom.otherUser._id,
      content: '调试测试消息 - ' + new Date().toLocaleTimeString(),
      messageType: 'text'
    };
    
    console.log('发送的消息数据:', JSON.stringify(messageData, null, 2));
    
    try {
      const sendResponse = await axios.post(`${API_BASE}/chat/send`, messageData);
      
      if (sendResponse.data.success) {
        console.log('✅ 消息发送成功!');
        console.log('返回的消息数据:', JSON.stringify(sendResponse.data.data, null, 2));
      } else {
        console.log('❌ 消息发送失败:', sendResponse.data.message);
      }
    } catch (sendError) {
      console.log('❌ 发送消息API调用失败:');
      console.log('状态码:', sendError.response?.status);
      console.log('错误消息:', sendError.response?.data?.message);
      console.log('详细错误:', sendError.response?.data?.error);
      
      // 如果是权限问题，检查任务详情
      if (sendError.response?.status === 403) {
        console.log('\n🔍 检查任务权限...');
        try {
          const taskResponse = await axios.get(`${API_BASE}/tasks/${testRoom.task._id}`);
          if (taskResponse.data.success) {
            const task = taskResponse.data.data;
            console.log('任务发布者:', task.publisher?._id);
            console.log('任务接取者:', task.assignee?._id);
            console.log('申请者列表:', task.applicants?.map(app => app.user?._id || app.user));
            console.log('当前用户ID:', user._id);
            
            const isPublisher = task.publisher?._id === user._id;
            const isAssignee = task.assignee?._id === user._id;
            const isApplicant = task.applicants?.some(app => 
              (app.user?._id || app.user) === user._id
            );
            
            console.log('权限检查:');
            console.log('- 是发布者:', isPublisher);
            console.log('- 是接取者:', isAssignee);
            console.log('- 是申请者:', isApplicant);
          }
        } catch (taskError) {
          console.log('获取任务详情失败:', taskError.message);
        }
      }
    }
    
    // 5. 测试Socket.IO连接
    console.log('\n5. 测试Socket.IO连接...');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO连接成功');
      
      // 加入聊天室
      const roomId = `${testRoom.task._id}_${user._id}_${testRoom.otherUser._id}`;
      console.log('加入聊天室:', roomId);
      socket.emit('join_room', roomId);
      
      // 测试Socket发送消息
      setTimeout(() => {
        console.log('\n6. 测试Socket发送消息...');
        socket.emit('send_message', {
          ...messageData,
          content: 'Socket测试消息 - ' + new Date().toLocaleTimeString()
        });
        
        setTimeout(() => {
          socket.disconnect();
          console.log('\n🎉 调试完成!');
        }, 2000);
      }, 1000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO连接失败:', error.message);
    });
    
    socket.on('message_sent', (data) => {
      console.log('✅ Socket消息发送成功:', data);
    });
    
    socket.on('error', (error) => {
      console.log('❌ Socket错误:', error);
    });
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行调试
debugSendMessageError();