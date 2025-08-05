const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/campus_tasks', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testFrontendChatroomData() {
  try {
    console.log('=== 测试前端聊天室数据 ===');
    
    // 获取测试用户
    const testUser = await User.findOne({ username: 'testuser0' });
    if (!testUser) {
      console.log('未找到测试用户');
      return;
    }
    
    console.log('测试用户:', testUser.username, testUser._id);
    
    // 模拟登录获取token
    console.log('用户邮箱:', testUser.email);
    
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        email: testUser.email,
        password: '123456'
      });
      
      console.log('登录响应:', loginResponse.data);
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.token;
        console.log('登录成功，获取到token');
        
        // 调用聊天室API
        const chatroomResponse = await axios.get('http://localhost:3000/api/chat/rooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (chatroomResponse.data.success) {
          console.log('\n=== 聊天室API返回数据 ===');
          const chatRooms = chatroomResponse.data.data;
          
          console.log('聊天室数量:', chatRooms.length);
          
          chatRooms.forEach((room, index) => {
            console.log(`\n聊天室 ${index + 1}:`);
            console.log('  _id:', room._id);
            console.log('  task.title:', room.task?.title);
            console.log('  task._id:', room.task?._id);
            console.log('  otherUser._id:', room.otherUser?._id);
            console.log('  otherUser.username:', room.otherUser?.username);
            console.log('  otherUser.email:', room.otherUser?.email);
            console.log('  lastMessage:', room.lastMessage);
            console.log('  unreadCount:', room.unreadCount);
            
            // 检查是否otherUser是当前用户
            if (room.otherUser?._id === testUser._id.toString()) {
              console.log('  ⚠️  警告: otherUser是当前用户自己!');
            } else {
              console.log('  ✅ otherUser正确，不是当前用户');
            }
          });
          
          // 模拟前端处理逻辑
          console.log('\n=== 模拟前端处理逻辑 ===');
          const currentUser = { _id: testUser._id.toString(), username: testUser.username };
          console.log('当前用户:', currentUser);
          
          chatRooms.forEach((room, index) => {
            console.log(`\n前端处理聊天室 ${index + 1}:`);
            console.log('  显示的用户名:', room.otherUser?.username || '未知用户');
            console.log('  是否应该显示:', room.otherUser?._id !== currentUser._id ? '是' : '否（这是当前用户）');
          });
          
        } else {
          console.log('聊天室API调用失败:', chatroomResponse.data);
        }
        
      } else {
        console.log('登录失败:', loginResponse.data);
      }
    } catch (error) {
      console.log('API调用失败:', error.message);
      if (error.response) {
        console.log('错误响应:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFrontendChatroomData();