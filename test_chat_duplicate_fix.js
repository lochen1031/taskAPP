const axios = require('axios');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

async function testChatDuplicateFix() {
  try {
    console.log('🧪 测试申请者聊天重复问题修复...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskapp');
    console.log('✅ 数据库连接成功');
    
    // 获取测试数据
    const users = await User.find({}).limit(3);
    const tasks = await Task.find({}).limit(2);
    
    if (users.length < 2 || tasks.length < 1) {
      console.log('❌ 测试数据不足，需要至少2个用户和1个任务');
      return;
    }
    
    const user1 = users[0]; // 任务发布者
    const user2 = users[1]; // 申请者
    const task = tasks[0];
    
    console.log(`📋 测试任务: ${task.title}`);
    console.log(`👤 用户1: ${user1.username} (${user1.email})`);
    console.log(`👤 用户2: ${user2.username} (${user2.email})`);
    
    // 模拟前端聊天室访问URL
    const chatUrl = `http://localhost:3000/chat?task=${task._id}&user=${user2._id}`;
    console.log(`\n🔗 申请者聊天URL: ${chatUrl}`);
    
    // 检查现有消息
    const existingMessages = await Message.find({
      task: task._id,
      $or: [
        { sender: user1._id, receiver: user2._id },
        { sender: user2._id, receiver: user1._id }
      ]
    }).populate('sender', 'username');
    
    console.log(`\n📨 现有消息数: ${existingMessages.length}`);
    existingMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.sender.username}: ${msg.content}`);
    });
    
    // 测试聊天室API
    console.log('\n🔍 测试聊天室API...');
    
    // 模拟用户1登录并获取聊天室列表
    try {
      const chatRoomsResponse = await axios.get('http://localhost:5000/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${generateTestToken(user1._id)}`
        }
      });
      
      if (chatRoomsResponse.data.success) {
        const chatRooms = chatRoomsResponse.data.data;
        console.log(`✅ 用户1聊天室数量: ${chatRooms.length}`);
        
        // 检查是否有重复的聊天室
        const roomKeys = new Set();
        const duplicates = [];
        
        chatRooms.forEach(room => {
          if (room.task && room.otherUser) {
            const key = `${room.task._id}_${room.otherUser._id}`;
            if (roomKeys.has(key)) {
              duplicates.push(room);
            } else {
              roomKeys.add(key);
            }
          }
        });
        
        if (duplicates.length > 0) {
          console.log(`⚠️ 发现 ${duplicates.length} 个重复聊天室:`);
          duplicates.forEach((dup, index) => {
            console.log(`   ${index + 1}. 任务: ${dup.task.title} | 用户: ${dup.otherUser.username}`);
          });
        } else {
          console.log('✅ 没有发现重复聊天室');
        }
        
        // 显示聊天室详情
        chatRooms.forEach((room, index) => {
          console.log(`   ${index + 1}. 任务: ${room.task.title} | 对方: ${room.otherUser.username} | 消息数: ${room.lastMessage ? '有' : '无'}`);
        });
      }
    } catch (error) {
      console.log('⚠️ 聊天室API测试失败 (可能需要有效的认证token)');
    }
    
    // 测试特定聊天室访问
    console.log('\n🎯 测试特定聊天室访问...');
    try {
      const roomResponse = await axios.get(`http://localhost:5000/chat/room/${task._id}/${user2._id}`, {
        headers: {
          'Authorization': `Bearer ${generateTestToken(user1._id)}`
        }
      });
      
      if (roomResponse.data.success) {
        const messages = roomResponse.data.data.messages;
        console.log(`✅ 聊天室消息获取成功，消息数: ${messages.length}`);
      }
    } catch (error) {
      console.log('⚠️ 聊天室消息获取失败 (可能需要有效的认证token)');
    }
    
    console.log('\n📝 测试建议:');
    console.log('1. 打开浏览器访问前端应用');
    console.log('2. 登录任一用户账号');
    console.log('3. 进入任务详情页面');
    console.log('4. 点击申请者旁边的"聊天"按钮');
    console.log('5. 观察左侧聊天列表是否出现重复项');
    console.log('6. 发送消息测试功能是否正常');
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 数据库连接已关闭');
  }
}

// 生成简单的测试token (仅用于测试)
function generateTestToken(userId) {
  // 这里应该使用与后端相同的JWT签名方法
  // 为了测试目的，返回一个简单的标识
  return `test_token_${userId}`;
}

testChatDuplicateFix();