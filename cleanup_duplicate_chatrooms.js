const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

async function cleanupDuplicateChatrooms() {
  try {
    console.log('🧹 开始清理重复聊天室记录...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskapp');
    console.log('✅ 数据库连接成功');
    
    // 获取所有消息
    const allMessages = await Message.find({}).populate('sender', 'username').populate('task', 'title');
    console.log(`📊 总消息数: ${allMessages.length}`);
    
    // 按任务和用户组合分组
    const chatRoomGroups = {};
    
    allMessages.forEach(message => {
      if (message.task && message.sender) {
        const key = `${message.task._id}_${message.sender._id}`;
        if (!chatRoomGroups[key]) {
          chatRoomGroups[key] = {
            taskId: message.task._id,
            taskTitle: message.task.title,
            userId: message.sender._id,
            username: message.sender.username,
            messages: []
          };
        }
        chatRoomGroups[key].messages.push(message);
      }
    });
    
    console.log(`📋 发现 ${Object.keys(chatRoomGroups).length} 个唯一聊天室组合`);
    
    // 显示聊天室统计
    Object.values(chatRoomGroups).forEach((group, index) => {
      console.log(`${index + 1}. 任务: ${group.taskTitle} | 用户: ${group.username} | 消息数: ${group.messages.length}`);
    });
    
    // 检查是否有重复的聊天室记录（这里主要是检查前端可能创建的重复项）
    const taskUserCombinations = new Set();
    const duplicates = [];
    
    Object.values(chatRoomGroups).forEach(group => {
      const combo = `${group.taskId}_${group.userId}`;
      if (taskUserCombinations.has(combo)) {
        duplicates.push(group);
      } else {
        taskUserCombinations.add(combo);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`⚠️ 发现 ${duplicates.length} 个重复的聊天室组合`);
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. ${dup.taskTitle} - ${dup.username}`);
      });
    } else {
      console.log('✅ 没有发现重复的聊天室记录');
    }
    
    // 清理可能的重复消息（相同内容、相同时间、相同发送者）
    console.log('\n🔍 检查重复消息...');
    const messageGroups = {};
    let duplicateMessages = 0;
    
    allMessages.forEach(message => {
      const key = `${message.sender._id}_${message.task._id}_${message.content}_${message.createdAt.getTime()}`;
      if (messageGroups[key]) {
        messageGroups[key].push(message);
      } else {
        messageGroups[key] = [message];
      }
    });
    
    for (const [key, messages] of Object.entries(messageGroups)) {
      if (messages.length > 1) {
        duplicateMessages += messages.length - 1;
        console.log(`   发现重复消息: "${messages[0].content}" (${messages.length} 条)`);
        
        // 删除重复的消息，保留第一条
        for (let i = 1; i < messages.length; i++) {
          await Message.findByIdAndDelete(messages[i]._id);
          console.log(`   ✅ 删除重复消息: ${messages[i]._id}`);
        }
      }
    }
    
    if (duplicateMessages > 0) {
      console.log(`✅ 清理了 ${duplicateMessages} 条重复消息`);
    } else {
      console.log('✅ 没有发现重复消息');
    }
    
    console.log('\n🎉 聊天室清理完成！');
    
  } catch (error) {
    console.error('❌ 清理过程中出错:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 数据库连接已关闭');
  }
}

cleanupDuplicateChatrooms();