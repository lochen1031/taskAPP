// 檢查400錯誤響應內容的調試腳本

const axios = require('axios');

// 配置axios
axios.defaults.baseURL = 'http://localhost:5000/api';

async function debug400Response() {
  console.log('=== 調試400錯誤響應 ===');
  
  try {
    // 1. 先登錄獲取token
    console.log('\n1. 登錄獲取token...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    let token, user;
    if (loginResponse.data && loginResponse.data.success) {
      token = loginResponse.data.token;
      user = loginResponse.data.user;
    } else if (loginResponse.data && loginResponse.data.data) {
      token = loginResponse.data.data.token;
      user = loginResponse.data.data.user;
    } else {
      token = loginResponse.data.token;
      user = loginResponse.data.user;
    }
    
    if (!token) {
      console.log('❌ 登錄失敗，無法獲取token');
      console.log('登錄響應:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    console.log('✅ 登錄成功');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('用戶ID:', user.id || user._id);
    
    // 2. 設置認證頭
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 3. 獲取聊天室列表
    console.log('\n2. 獲取聊天室列表...');
    const chatroomsResponse = await axios.get('/chat/rooms');
    
    if (!chatroomsResponse.data.success || chatroomsResponse.data.data.length === 0) {
      console.log('❌ 沒有可用的聊天室');
      return;
    }
    
    const chatroom = chatroomsResponse.data.data[0];
    console.log('✅ 找到聊天室:', chatroom.task.title);
    console.log('TaskID:', chatroom.task._id);
    console.log('ReceiverID:', chatroom.otherUser._id);
    
    // 4. 嘗試發送消息並捕獲詳細錯誤
    console.log('\n3. 測試各種可能導致400錯誤的情況...');
    
    const testCases = [
      {
        name: '正常消息',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        }
      },
      {
        name: '缺少taskId',
        data: {
          receiverId: chatroom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        }
      },
      {
        name: '缺少receiverId',
        data: {
          taskId: chatroom.task._id,
          content: '測試消息',
          messageType: 'text'
        }
      },
      {
        name: '缺少content',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          messageType: 'text'
        }
      },
      {
        name: '無效的taskId',
        data: {
          taskId: 'invalid_task_id',
          receiverId: chatroom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        }
      },
      {
        name: '無效的receiverId',
        data: {
          taskId: chatroom.task._id,
          receiverId: 'invalid_receiver_id',
          content: '測試消息',
          messageType: 'text'
        }
      },
      {
        name: '空content',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '',
          messageType: 'text'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n測試案例: ${testCase.name}`);
      console.log('發送數據:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const response = await axios.post('/chat/send', testCase.data);
        console.log('✅ 成功:', response.data);
      } catch (error) {
        console.log('❌ 失敗:');
        console.log('- 狀態碼:', error.response?.status);
        console.log('- 錯誤消息:', error.message);
        console.log('- 響應數據:', JSON.stringify(error.response?.data, null, 2));
        console.log('- 請求URL:', error.config?.url);
        console.log('- 請求方法:', error.config?.method);
        console.log('- 請求頭:', JSON.stringify(error.config?.headers, null, 2));
        
        if (error.response?.status === 400) {
          console.log('🎯 這是400錯誤！詳細分析:');
          console.log('- 完整錯誤對象:', {
            message: error.message,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ 調試過程中發生錯誤:', error.message);
    console.log('錯誤詳情:', error);
  }
}

// 運行調試
debug400Response().catch(console.error);