const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/campus_tasks', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugCurrentUserChatrooms() {
  try {
    console.log('=== 调试当前用户聊天室数据 ===');
    
    // 获取所有用户
    const users = await User.find({}).select('username email _id');
    console.log('\n所有用户:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user._id}`);
    });
    
    // 测试每个用户的聊天室数据
    for (const testUser of users.slice(0, 3)) { // 只测试前3个用户
      console.log(`\n=== 测试用户: ${testUser.username} ===`);
      
      try {
        // 尝试登录
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
          email: testUser.email,
          password: '123456'
        });
        
        if (loginResponse.data.success) {
          const token = loginResponse.data.token;
          console.log(`✅ ${testUser.username} 登录成功`);
          
          // 获取聊天室数据
          const chatroomResponse = await axios.get('http://localhost:3000/api/chat/rooms', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (chatroomResponse.data.success) {
            const chatRooms = chatroomResponse.data.data;
            console.log(`聊天室数量: ${chatRooms.length}`);
            
            chatRooms.forEach((room, index) => {
              console.log(`\n  聊天室 ${index + 1}:`);
              console.log(`    任务: ${room.task?.title || '无标题'}`);
              console.log(`    otherUser ID: ${room.otherUser?._id}`);
              console.log(`    otherUser 用户名: ${room.otherUser?.username || '无用户名'}`);
              console.log(`    当前用户 ID: ${testUser._id}`);
              
              // 检查otherUser是否有username字段
              if (!room.otherUser?.username) {
                console.log(`    ⚠️  otherUser缺少username字段!`);
                console.log(`    otherUser完整数据:`, room.otherUser);
              }
              
              // 检查是否是自己
              if (room.otherUser?._id === testUser._id.toString()) {
                console.log(`    ❌ 错误: otherUser是当前用户自己!`);
              } else {
                console.log(`    ✅ otherUser正确，不是当前用户`);
              }
            });
          } else {
            console.log(`❌ 获取聊天室失败:`, chatroomResponse.data);
          }
        } else {
          console.log(`❌ ${testUser.username} 登录失败:`, loginResponse.data);
        }
      } catch (error) {
        console.log(`❌ ${testUser.username} 测试失败:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCurrentUserChatrooms();