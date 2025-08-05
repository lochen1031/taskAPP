// 調試400錯誤的具體原因
const axios = require('axios');

async function debug400Error() {
  console.log('=== 調試400錯誤 ===');
  
  try {
    // 1. 先登錄獲取token
    console.log('\n1. 登錄獲取token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    const loginData = loginResponse.data;
    if (!loginData.success) {
      console.log('❌ 登錄失敗:', loginData.message);
      return;
    }
    
    const { token, user } = loginData.data || loginData;
    console.log('✅ 登錄成功, 用戶:', user.username || user.email);
    
    // 2. 獲取聊天室列表
    console.log('\n2. 獲取聊天室列表...');
    const chatRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
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
      
      // 3. 測試發送消息
      console.log('\n3. 測試發送消息...');
      const messageData = {
        taskId: firstRoom.task._id,
        receiverId: firstRoom.otherUser._id,
        content: '調試400錯誤測試消息',
        messageType: 'text'
      };
      
      console.log('發送的消息數據:', messageData);
      
      try {
        const response = await axios.post('http://localhost:5000/api/chat/send', messageData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ 消息發送成功!');
        console.log('返回數據:', response.data);
        
      } catch (sendError) {
        console.log('❌ 發送消息失敗!');
        console.log('錯誤狀態碼:', sendError.response?.status);
        console.log('錯誤響應:', sendError.response?.data);
        console.log('請求頭:', sendError.config?.headers);
        console.log('請求數據:', sendError.config?.data);
        console.log('請求URL:', sendError.config?.url);
        
        // 檢查具體的驗證錯誤
        if (sendError.response?.data?.message) {
          console.log('具體錯誤信息:', sendError.response.data.message);
        }
        
        // 檢查參數驗證
        console.log('\n參數驗證:');
        console.log('- taskId存在:', !!messageData.taskId);
        console.log('- receiverId存在:', !!messageData.receiverId);
        console.log('- content存在:', !!messageData.content);
        console.log('- taskId類型:', typeof messageData.taskId);
        console.log('- receiverId類型:', typeof messageData.receiverId);
      }
    } else {
      console.log('❌ 沒有可用的聊天室');
    }
    
  } catch (error) {
    console.log('❌ 調試過程中發生錯誤:', error.message);
    if (error.response) {
      console.log('錯誤響應:', error.response.data);
    }
  }
}

debug400Error();