// 检查前端聊天室显示问题
const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const Task = require('./models/Task');

async function checkFrontendDisplay() {
  try {
    console.log('=== 检查前端聊天室显示问题 ===\n');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/campus_tasks');
    console.log('✅ 数据库连接成功\n');
    
    // 获取所有聊天室数据（通过Message聚合）
    console.log('1. 获取聊天室原始数据...');
    const chatRooms = await Message.aggregate([
      {
        $group: {
          _id: '$chatRoom',
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          task: { $last: '$task' },
          participants: { $addToSet: '$sender' }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'task',
          foreignField: '_id',
          as: 'taskInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantInfo'
        }
      }
    ]);
    
    console.log(`找到 ${chatRooms.length} 个聊天室:\n`);
    
    for (const room of chatRooms) {
      console.log(`聊天室 ID: ${room._id}`);
      console.log(`任务: ${room.taskInfo && room.taskInfo[0] ? room.taskInfo[0].title : '未找到任务'}`);
      console.log(`参与者数量: ${room.participantInfo ? room.participantInfo.length : 0}`);
      
      if (room.participantInfo && room.participantInfo.length > 0) {
        console.log('参与者详情:');
        room.participantInfo.forEach((participant, index) => {
          console.log(`  ${index + 1}. 用户名: ${participant.username || '未设置'}, 邮箱: ${participant.email}`);
        });
      }
      
      console.log('---');
    }
    
    // 模拟前端逻辑：为每个聊天室确定otherUser
    console.log('\n2. 模拟前端逻辑...');
    
    // 获取一个真实的用户ID作为当前用户
    const firstUser = await User.findOne();
    const currentUserId = firstUser ? firstUser._id.toString() : null;
    
    if (!currentUserId) {
      console.log('❌ 没有找到用户数据');
      return;
    }
    
    console.log(`使用用户 ${firstUser.username} (${currentUserId}) 作为当前用户\n`);
    
    for (const room of chatRooms) {
      if (room.participantInfo && room.participantInfo.length >= 2) {
        const otherUser = room.participantInfo.find(p => p._id.toString() !== currentUserId);
        console.log(`聊天室 ${room._id}:`);
        console.log(`  任务: ${room.taskInfo && room.taskInfo[0] ? room.taskInfo[0].title : '未知任务'}`);
        console.log(`  当前用户: ${firstUser.username}`);
        console.log(`  其他用户: ${otherUser ? otherUser.username : '未找到'}`);
        console.log(`  其他用户邮箱: ${otherUser ? otherUser.email : '未找到'}`);
        console.log('---');
      }
    }
    
    // 检查用户数据完整性
    console.log('\n3. 检查用户数据完整性...');
    const usersWithoutUsername = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });
    
    if (usersWithoutUsername.length > 0) {
      console.log(`❌ 发现 ${usersWithoutUsername.length} 个用户缺少用户名:`);
      usersWithoutUsername.forEach(user => {
        console.log(`  ID: ${user._id}, 邮箱: ${user.email}, 用户名: ${user.username || '未设置'}`);
      });
    } else {
      console.log('✅ 所有用户都有用户名');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
    if (error.response && error.response.data) {
      console.error('响应数据:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

checkFrontendDisplay();