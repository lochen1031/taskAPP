const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task_platform')
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

const User = require('./models/User');
const Task = require('./models/Task');
const Message = require('./models/Message');

async function debugChatroomAPI() {
  try {
    console.log('=== 调试聊天室API数据结构 ===\n');
    
    // 等待服务器稳定
    console.log('等待服务器稳定...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. 登录获取token
    console.log('1. 登录用户...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`登录成功: ${user.username} (${user._id})\n`);
    
    // 2. 直接查询数据库中的用户和任务数据
    console.log('2. 检查数据库中的用户数据...');
    const dbUsers = await User.find({}, 'username avatar').limit(5);
    console.log('数据库中的用户:');
    dbUsers.forEach(u => {
      console.log(`  - ${u._id}: ${u.username}`);
    });
    
    console.log('\n3. 检查数据库中的任务数据...');
    const dbTasks = await Task.find({}, 'title status').limit(5);
    console.log('数据库中的任务:');
    dbTasks.forEach(t => {
      console.log(`  - ${t._id}: ${t.title}`);
    });
    
    // 3. 调用聊天室API
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
      console.log(`  lastMessageTime: ${room.lastMessageTime}`);
      
      // 检查task数据
      console.log(`  task:`);
      if (room.task) {
        console.log(`    _id: ${room.task._id}`);
        console.log(`    title: "${room.task.title}"`);
        console.log(`    status: ${room.task.status}`);
        console.log(`    type: ${typeof room.task.title}`);
      } else {
        console.log(`    null 或 undefined`);
      }
      
      // 检查otherUser数据
      console.log(`  otherUser:`);
      if (room.otherUser) {
        console.log(`    _id: ${room.otherUser._id}`);
        console.log(`    username: "${room.otherUser.username}"`);
        console.log(`    avatar: ${room.otherUser.avatar}`);
        console.log(`    type: ${typeof room.otherUser.username}`);
      } else {
        console.log(`    null 或 undefined`);
      }
      
      console.log(`  unreadCount: ${room.unreadCount}`);
      console.log('');
    });
    
    // 4. 检查是否有数据混乱
    console.log('5. 数据一致性检查...');
    for (let i = 0; i < chatRooms.length; i++) {
      const room = chatRooms[i];
      if (room.task && room.otherUser) {
        // 检查是否task.title被错误地赋值给了otherUser.username
        if (room.otherUser.username === room.task.title) {
          console.log(`❌ 发现数据混乱: 聊天室 ${i + 1} 中 otherUser.username ("${room.otherUser.username}") 等于 task.title ("${room.task.title}")`);
        }
        
        // 检查数据类型
        if (typeof room.otherUser.username !== 'string') {
          console.log(`❌ 数据类型错误: otherUser.username 不是字符串类型: ${typeof room.otherUser.username}`);
        }
        
        if (typeof room.task.title !== 'string') {
          console.log(`❌ 数据类型错误: task.title 不是字符串类型: ${typeof room.task.title}`);
        }
      }
    }
    
    // 5. 直接查询聚合结果
    console.log('\n6. 直接执行聚合查询...');
    const userObjectId = new mongoose.Types.ObjectId(user._id);
    
    const aggregateResult = await Message.aggregate([
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
    
    console.log('聚合查询原始结果:');
    aggregateResult.forEach((room, index) => {
      console.log(`原始聊天室 ${index + 1}:`);
      console.log(`  _id: ${room._id}`);
      console.log(`  task ObjectId: ${room.task}`);
      console.log(`  otherUser ObjectId: ${room.otherUser}`);
      console.log(`  lastMessage: ${room.lastMessage}`);
    });
    
    // 6. 手动填充数据
    console.log('\n7. 手动填充数据...');
    for (let i = 0; i < Math.min(aggregateResult.length, 3); i++) {
      const room = aggregateResult[i];
      console.log(`\n填充聊天室 ${i + 1}:`);
      
      const task = await Task.findById(room.task).select('title status category');
      const otherUser = await User.findById(room.otherUser).select('username avatar university');
      
      console.log(`  填充后的task:`, task ? { _id: task._id, title: task.title, status: task.status } : 'null');
      console.log(`  填充后的otherUser:`, otherUser ? { _id: otherUser._id, username: otherUser.username, avatar: otherUser.avatar } : 'null');
    }
    
  } catch (error) {
    console.error('调试过程中出错:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  } finally {
    mongoose.connection.close();
  }
}

debugChatroomAPI();