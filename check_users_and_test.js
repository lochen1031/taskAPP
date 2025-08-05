const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task_platform')
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

const User = require('./models/User');
const Task = require('./models/Task');
const Message = require('./models/Message');
const axios = require('axios');

async function checkUsersAndTest() {
  try {
    console.log('=== 检查用户并测试聊天室API ===\n');
    
    // 1. 查看数据库中的所有用户
    console.log('1. 数据库中的用户:');
    const users = await User.find({}, 'username email').limit(10);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ID: ${user._id}`);
    });
    
    if (users.length === 0) {
      console.log('  没有找到用户');
      return;
    }
    
    // 2. 使用第一个用户进行测试
    const testUser = users[0];
    console.log(`\n2. 使用用户 ${testUser.username} 进行测试...`);
    
    // 等待服务器稳定
    console.log('等待服务器稳定...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. 尝试登录（使用默认密码）
    console.log('3. 尝试登录...');
    let token, user;
    
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: testUser.email,
        password: 'password123'  // 假设默认密码
      });
      
      token = loginResponse.data.token;
      user = loginResponse.data.user;
      console.log(`登录成功: ${user.username} (${user._id})`);
    } catch (loginError) {
      console.log('使用默认密码登录失败，尝试其他密码...');
      
      // 尝试其他常见密码
      const passwords = ['123456', 'password', 'test123', '111111'];
      let loginSuccess = false;
      
      for (const pwd of passwords) {
        try {
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: testUser.email,
            password: pwd
          });
          
          token = loginResponse.data.token;
          user = loginResponse.data.user;
          console.log(`使用密码 "${pwd}" 登录成功: ${user.username} (${user._id})`);
          loginSuccess = true;
          break;
        } catch (e) {
          // 继续尝试下一个密码
        }
      }
      
      if (!loginSuccess) {
        console.log('所有密码尝试失败，无法登录');
        return;
      }
    }
    
    // 4. 调用聊天室API
    console.log('\n4. 调用聊天室API...');
    const chatroomResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const chatRooms = chatroomResponse.data.data;
    console.log(`\n获取到 ${chatRooms.length} 个聊天室:\n`);
    
    chatRooms.forEach((room, index) => {
      console.log(`聊天室 ${index + 1}:`);
      console.log(`  _id: ${room._id}`);
      console.log(`  lastMessage: ${room.lastMessage}`);
      
      // 检查task数据
      console.log(`  task:`);
      if (room.task) {
        console.log(`    _id: ${room.task._id}`);
        console.log(`    title: "${room.task.title}"`);
        console.log(`    status: ${room.task.status}`);
      } else {
        console.log(`    null`);
      }
      
      // 检查otherUser数据
      console.log(`  otherUser:`);
      if (room.otherUser) {
        console.log(`    _id: ${room.otherUser._id}`);
        console.log(`    username: "${room.otherUser.username}"`);
        console.log(`    avatar: ${room.otherUser.avatar}`);
      } else {
        console.log(`    null`);
      }
      
      console.log(`  unreadCount: ${room.unreadCount}`);
      console.log('');
      
      // 检查数据是否混乱
      if (room.task && room.otherUser) {
        if (room.otherUser.username === room.task.title) {
          console.log(`  ❌ 数据混乱: otherUser.username ("${room.otherUser.username}") 等于 task.title ("${room.task.title}")`);
        } else {
          console.log(`  ✅ 数据正常: otherUser.username ("${room.otherUser.username}") 不等于 task.title ("${room.task.title}")`);
        }
      }
    });
    
    // 5. 检查前端可能的问题
    console.log('\n5. 前端显示逻辑检查:');
    console.log('根据前端代码，聊天室列表应该显示:');
    console.log('- title: room.otherUser.username');
    console.log('- description: room.task.title');
    console.log('');
    console.log('如果前端显示的是任务名称作为标题，可能的原因:');
    console.log('1. 前端代码中title和description的位置颠倒了');
    console.log('2. 数据结构在传输过程中被修改了');
    console.log('3. 前端缓存了错误的数据');
    
  } catch (error) {
    console.error('测试过程中出错:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  } finally {
    mongoose.connection.close();
  }
}

checkUsersAndTest();