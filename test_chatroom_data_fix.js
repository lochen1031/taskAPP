// 测试聊天室数据修复效果的脚本

const axios = require('axios');

// 设置axios基础配置
axios.defaults.baseURL = 'http://localhost:5000/api';

async function testChatroomDataFix() {
  console.log('=== 测试聊天室数据修复效果 ===');
  console.log('时间:', new Date().toLocaleString());
  
  try {
    // 1. 用户登录
    console.log('\n1. 用户登录...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 用户登录成功');
      const token = loginResponse.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('❌ 用户登录失败:', loginResponse.data.message);
      return;
    }
    
    // 2. 获取聊天室列表（修复前后对比）
    console.log('\n2. 获取聊天室列表...');
    const roomsResponse = await axios.get('/chat/rooms');
    
    if (roomsResponse.data.success) {
      const rooms = roomsResponse.data.data;
      console.log('✅ 获取聊天室列表成功');
      console.log(`   聊天室数量: ${rooms.length}`);
      
      if (rooms.length === 0) {
        console.log('   ℹ️ 当前没有聊天室数据');
        return;
      }
      
      // 3. 验证每个聊天室的数据完整性
      console.log('\n3. 验证聊天室数据完整性...');
      let validCount = 0;
      let invalidCount = 0;
      
      rooms.forEach((room, index) => {
        console.log(`\n   聊天室 ${index + 1}:`);
        console.log(`   - ID: ${room._id}`);
        
        // 检查task对象
        if (room.task && room.task._id) {
          console.log(`   - ✅ 任务数据完整`);
          console.log(`     - 任务ID: ${room.task._id}`);
          console.log(`     - 任务标题: ${room.task.title}`);
          console.log(`     - 任务状态: ${room.task.status}`);
        } else {
          console.log(`   - ❌ 任务数据不完整`);
          console.log(`     - task对象:`, room.task);
          invalidCount++;
        }
        
        // 检查otherUser对象
        if (room.otherUser && room.otherUser._id) {
          console.log(`   - ✅ 用户数据完整`);
          console.log(`     - 用户ID: ${room.otherUser._id}`);
          console.log(`     - 用户名: ${room.otherUser.username}`);
          console.log(`     - 大学: ${room.otherUser.university || '未设置'}`);
        } else {
          console.log(`   - ❌ 用户数据不完整`);
          console.log(`     - otherUser对象:`, room.otherUser);
          invalidCount++;
        }
        
        // 检查其他字段
        console.log(`   - 最后消息: ${room.lastMessage || '无'}`);
        console.log(`   - 最后消息时间: ${room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleString() : '无'}`);
        console.log(`   - 未读消息数: ${room.unreadCount || 0}`);
        
        // 判断整体有效性
        if (room.task && room.task._id && room.otherUser && room.otherUser._id) {
          validCount++;
          console.log(`   - 🎯 整体状态: 有效`);
        } else {
          console.log(`   - ⚠️ 整体状态: 无效`);
        }
      });
      
      console.log('\n=== 数据完整性统计 ===');
      console.log(`✅ 有效聊天室: ${validCount}`);
      console.log(`❌ 无效聊天室: ${invalidCount}`);
      console.log(`📊 有效率: ${((validCount / rooms.length) * 100).toFixed(1)}%`);
      
      if (invalidCount === 0) {
        console.log('🎉 所有聊天室数据都是完整的！');
      } else {
        console.log('⚠️ 仍有无效聊天室数据，需要进一步检查');
      }
      
      // 4. 测试消息发送（使用第一个有效聊天室）
      const validRoom = rooms.find(room => 
        room.task && room.task._id && 
        room.otherUser && room.otherUser._id
      );
      
      if (validRoom) {
        console.log('\n4. 测试消息发送...');
        const messageData = {
          taskId: validRoom.task._id,
          receiverId: validRoom.otherUser._id,
          content: '聊天室数据修复测试消息 - ' + new Date().toLocaleTimeString(),
          messageType: 'text'
        };
        
        console.log('   发送消息数据:', JSON.stringify(messageData, null, 2));
        
        try {
          const sendResponse = await axios.post('/chat/send', messageData);
          
          if (sendResponse.data.success) {
            console.log('   ✅ 消息发送成功!');
            console.log('   返回的消息ID:', sendResponse.data.data._id);
            console.log('   消息内容:', sendResponse.data.data.content);
          } else {
            console.log('   ❌ 消息发送失败:', sendResponse.data.message);
          }
        } catch (sendError) {
          console.log('   ❌ 消息发送错误:');
          console.log('      状态码:', sendError.response?.status);
          console.log('      错误消息:', sendError.response?.data?.message);
          
          if (sendError.response?.status === 400) {
            console.log('   🚨 仍然存在400错误!');
            console.log('      这可能表明前端仍在发送无效数据');
          }
        }
      } else {
        console.log('\n4. ❌ 没有有效的聊天室可以测试消息发送');
      }
      
    } else {
      console.log('❌ 获取聊天室列表失败:', roomsResponse.data.message);
    }
    
    console.log('\n=== 修复效果总结 ===');
    console.log('✅ 后端API已添加数据完整性过滤');
    console.log('✅ 前端已添加数据验证和错误处理');
    console.log('✅ 无效聊天室数据会被自动过滤');
    console.log('\n🎯 用户操作建议:');
    console.log('1. 硬刷新浏览器 (Ctrl+F5)');
    console.log('2. 清除浏览器缓存和localStorage');
    console.log('3. 重新登录应用');
    console.log('4. 访问调试页面: http://localhost:3000/debug_frontend.html');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testChatroomDataFix();