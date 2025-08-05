// 調試前端請求配置
const axios = require('axios');

async function debugFrontendRequest() {
  console.log('=== 調試前端請求配置 ===');
  
  // 模擬前端axios配置
  const frontendAxios = axios.create();
  frontendAxios.defaults.baseURL = 'http://localhost:5000/api';
  
  console.log('\n1. 前端axios配置:');
  console.log('- baseURL:', frontendAxios.defaults.baseURL);
  
  try {
    // 1. 登錄獲取token
    console.log('\n2. 登錄獲取token...');
    const loginResponse = await frontendAxios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    const { token, user } = loginResponse.data.data || loginResponse.data;
    console.log('✅ 登錄成功, 用戶:', user.username);
    
    // 設置認證頭
    frontendAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. 獲取聊天室列表
    console.log('\n3. 獲取聊天室列表...');
    const chatRoomsResponse = await frontendAxios.get('/chat/rooms');
    
    const chatRooms = chatRoomsResponse.data.data;
    console.log('✅ 獲取到聊天室數量:', chatRooms.length);
    
    if (chatRooms.length > 0) {
      const firstRoom = chatRooms[0];
      console.log('第一個聊天室信息:', {
        taskId: firstRoom.task?._id,
        taskTitle: firstRoom.task?.title,
        otherUserId: firstRoom.otherUser?._id,
        otherUsername: firstRoom.otherUser?.username
      });
      
      // 3. 測試發送消息（模擬前端請求）
      console.log('\n4. 測試發送消息（模擬前端）...');
      const messageData = {
        taskId: firstRoom.task._id,
        receiverId: firstRoom.otherUser._id,
        content: '前端模擬測試消息',
        messageType: 'text'
      };
      
      console.log('發送的消息數據:', messageData);
      console.log('請求URL:', frontendAxios.defaults.baseURL + '/chat/send');
      console.log('請求頭:', frontendAxios.defaults.headers.common);
      
      try {
        const response = await frontendAxios.post('/chat/send', messageData);
        
        console.log('✅ 前端模擬發送成功!');
        console.log('返回數據:', response.data);
        
      } catch (sendError) {
        console.log('❌ 前端模擬發送失敗!');
        console.log('錯誤狀態碼:', sendError.response?.status);
        console.log('錯誤響應:', sendError.response?.data);
        console.log('請求配置:', {
          url: sendError.config?.url,
          baseURL: sendError.config?.baseURL,
          method: sendError.config?.method,
          headers: sendError.config?.headers,
          data: sendError.config?.data
        });
        
        // 檢查具體的驗證錯誤
        if (sendError.response?.data?.message) {
          console.log('具體錯誤信息:', sendError.response.data.message);
        }
      }
    } else {
      console.log('❌ 沒有可用的聊天室');
    }
    
  } catch (error) {
    console.log('❌ 調試過程中發生錯誤:', error.message);
    if (error.response) {
      console.log('錯誤響應:', error.response.data);
      console.log('錯誤狀態:', error.response.status);
    }
  }
}

debugFrontendRequest();