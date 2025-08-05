const axios = require('axios');

async function testChatRoomsAPI() {
  try {
    console.log('=== 测试聊天室API响应 ===');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.error('登录失败:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 调用聊天室API
    const chatroomResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (chatroomResponse.data.success) {
      console.log('\n=== API返回的原始数据 ===');
      console.log('完整响应:', JSON.stringify(chatroomResponse.data, null, 2));
      
      console.log('\n=== 聊天室数据详细分析 ===');
      const chatRooms = chatroomResponse.data.data;
      
      chatRooms.forEach((room, index) => {
        console.log(`\n聊天室 ${index + 1}:`);
        console.log('  _id:', room._id);
        console.log('  task:', room.task);
        console.log('  otherUser:', room.otherUser);
        console.log('  otherUser.username:', room.otherUser?.username);
        console.log('  otherUser._id:', room.otherUser?._id);
        console.log('  lastMessage:', room.lastMessage);
        console.log('  lastMessageTime:', room.lastMessageTime);
        console.log('  unreadCount:', room.unreadCount);
      });
    } else {
      console.error('API调用失败:', chatroomResponse.data);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testChatRoomsAPI();