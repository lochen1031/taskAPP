const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 直接测试聊天室API
async function testChatRoomsAPI() {
  console.log('=== 直接测试聊天室API ===\n');
  
  try {
    // 1. 连接数据库获取真实用户
    await mongoose.connect('mongodb://localhost:27017/campus_tasks');
    console.log('✅ 数据库连接成功');
    
    const User = require('./models/User');
    const users = await User.find({}).limit(3);
    
    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }
    
    console.log('找到用户:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user._id}`);
    });
    
    // 2. 尝试登录第一个用户
    const testUser = users[0];
    console.log(`\n尝试登录用户: ${testUser.username}`);
    
    // 先尝试常见密码
    const commonPasswords = ['123456', 'password123', 'password', '123'];
    let token = null;
    
    for (const password of commonPasswords) {
      try {
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: testUser.email,
          password: password
        });
        
        if (loginResponse.data.success) {
          token = loginResponse.data.token;
          console.log(`✅ 登录成功，密码: ${password}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 密码 ${password} 登录失败`);
      }
    }
    
    if (!token) {
      console.log('❌ 无法登录任何用户，跳过API测试');
      console.log('\n直接检查数据库中的聊天室数据...');
      
      // 直接查询数据库
      const Message = require('./models/Message');
      const Task = require('./models/Task');
      
      const userObjectId = new mongoose.Types.ObjectId(testUser._id);
      
      const chatRooms = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userObjectId },
              { receiver: userObjectId }
            ],
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$chatRoom',
            lastMessage: { $last: '$content' },
            lastMessageTime: { $last: '$createdAt' },
            lastMessageType: { $last: '$messageType' },
            task: { $last: '$task' },
            otherUser: {
              $last: {
                $cond: [
                  { $eq: ['$sender', userObjectId] },
                  '$receiver',
                  '$sender'
                ]
              }
            }
          }
        },
        {
          $sort: { lastMessageTime: -1 }
        }
      ]);
      
      console.log(`\n数据库查询结果: 找到 ${chatRooms.length} 个聊天室`);
      
      // 填充数据
      for (const room of chatRooms) {
        const [task, otherUser] = await Promise.all([
          Task.findById(room.task).select('title status category'),
          User.findById(room.otherUser).select('username avatar university')
        ]);
        
        console.log(`\n聊天室: ${room._id}`);
        console.log(`任务: ${task ? task.title : '未找到任务'}`);
        console.log(`其他用户: ${otherUser ? otherUser.username : '未找到用户'}`);
        console.log(`其他用户ID: ${room.otherUser}`);
        console.log(`最后消息: ${room.lastMessage}`);
      }
      
      return;
    }
    
    // 3. 测试聊天室API
    console.log('\n测试聊天室API...');
    
    const chatRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (chatRoomsResponse.data.success) {
      const rooms = chatRoomsResponse.data.data;
      console.log(`\n✅ API返回 ${rooms.length} 个聊天室:`);
      
      rooms.forEach((room, index) => {
        console.log(`\n${index + 1}. 聊天室 ${room._id}`);
        console.log(`   任务: ${room.task ? room.task.title : '未找到任务'}`);
        console.log(`   任务ID: ${room.task ? room.task._id : 'null'}`);
        console.log(`   其他用户: ${room.otherUser ? room.otherUser.username : '未找到用户'}`);
        console.log(`   其他用户ID: ${room.otherUser ? room.otherUser._id : 'null'}`);
        console.log(`   最后消息: ${room.lastMessage || '无'}`);
        console.log(`   未读数量: ${room.unreadCount || 0}`);
        
        // 检查数据完整性
        if (!room.task) {
          console.log('   ❌ 任务数据缺失');
        }
        if (!room.otherUser) {
          console.log('   ❌ 用户数据缺失');
        }
        if (!room.otherUser?.username) {
          console.log('   ❌ 用户名缺失');
        }
      });
    } else {
      console.log('❌ API调用失败:', chatRoomsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
    if (error.response && error.response.data) {
      console.error('响应数据:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

testChatRoomsAPI();