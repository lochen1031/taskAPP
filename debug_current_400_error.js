const axios = require('axios');

// 配置axios基礎URL（與前端保持一致）
axios.defaults.baseURL = 'http://localhost:5000/api';

async function testCurrentError() {
  console.log('=== 調試當前400錯誤 ===\n');
  
  try {
    // 1. 首先測試用戶登錄
    console.log('1. 測試用戶登錄...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登錄成功');
      const token = loginResponse.data.token;
      const userId = loginResponse.data.user._id;
      
      // 設置認證頭
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 2. 獲取聊天室列表
      console.log('\n2. 獲取聊天室列表...');
      const roomsResponse = await axios.get('/chat/rooms');
      
      if (roomsResponse.data.success && roomsResponse.data.data.length > 0) {
        console.log('✅ 獲取聊天室成功，數量:', roomsResponse.data.data.length);
        
        const firstRoom = roomsResponse.data.data[0];
        console.log('第一個聊天室:', {
          taskId: firstRoom.task?._id,
          otherUserId: firstRoom.otherUser?._id,
          taskTitle: firstRoom.task?.title
        });
        
        // 3. 測試發送消息（模擬前端的確切請求）
        console.log('\n3. 測試發送消息...');
        const messageData = {
          taskId: firstRoom.task._id,
          receiverId: firstRoom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        };
        
        console.log('發送的消息數據:', messageData);
        
        const sendResponse = await axios.post('/chat/send', messageData);
        
        if (sendResponse.data.success) {
          console.log('✅ 消息發送成功');
          console.log('返回的消息:', sendResponse.data.data);
        } else {
          console.log('❌ 消息發送失敗:', sendResponse.data);
        }
        
      } else {
        console.log('❌ 沒有找到聊天室');
      }
      
    } else {
      console.log('❌ 登錄失敗:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:');
    console.error('錯誤消息:', error.message);
    
    if (error.response) {
      console.error('響應狀態:', error.response.status);
      console.error('響應數據:', error.response.data);
      console.error('請求配置:', {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      });
    }
  }
}

// 運行測試
testCurrentError();