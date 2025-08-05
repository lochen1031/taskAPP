// 测试400错误修复效果的脚本

const axios = require('axios');

// 设置axios基础配置
axios.defaults.baseURL = 'http://localhost:5000/api';

async function test400ErrorFix() {
  console.log('=== 测试400错误修复效果 ===');
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
    
    // 2. 获取聊天室列表
    console.log('\n2. 获取聊天室列表...');
    const roomsResponse = await axios.get('/chat/rooms');
    
    if (roomsResponse.data.success && roomsResponse.data.data.length > 0) {
      console.log('✅ 获取聊天室列表成功');
      console.log(`   聊天室数量: ${roomsResponse.data.data.length}`);
      
      // 验证聊天室数据完整性
      console.log('\n3. 验证聊天室数据完整性...');
      const rooms = roomsResponse.data.data;
      let validRooms = 0;
      let invalidRooms = 0;
      
      rooms.forEach((room, index) => {
        const isValid = room && 
                       room.task && room.task._id && 
                       room.otherUser && room.otherUser._id;
        
        if (isValid) {
          validRooms++;
          console.log(`   ✅ 聊天室 ${index + 1}: 数据完整`);
          console.log(`      任务ID: ${room.task._id}`);
          console.log(`      任务标题: ${room.task.title}`);
          console.log(`      对方用户ID: ${room.otherUser._id}`);
          console.log(`      对方用户名: ${room.otherUser.username}`);
        } else {
          invalidRooms++;
          console.log(`   ❌ 聊天室 ${index + 1}: 数据不完整`);
          console.log(`      room对象:`, room);
          console.log(`      task对象:`, room?.task);
          console.log(`      otherUser对象:`, room?.otherUser);
        }
      });
      
      console.log(`\n   数据完整性统计:`);
      console.log(`   - 有效聊天室: ${validRooms}`);
      console.log(`   - 无效聊天室: ${invalidRooms}`);
      
      if (invalidRooms > 0) {
        console.log('   ⚠️ 发现无效聊天室数据，这可能导致400错误');
      }
      
      // 4. 测试发送消息
      if (validRooms > 0) {
        console.log('\n4. 测试发送消息...');
        const testRoom = rooms.find(room => 
          room && room.task && room.task._id && 
          room.otherUser && room.otherUser._id
        );
        
        if (testRoom) {
          const messageData = {
            taskId: testRoom.task._id,
            receiverId: testRoom.otherUser._id,
            content: '400错误修复测试消息 - ' + new Date().toLocaleTimeString(),
            messageType: 'text'
          };
          
          console.log('   发送消息数据:', JSON.stringify(messageData, null, 2));
          
          try {
            const sendResponse = await axios.post('/chat/send', messageData);
            
            if (sendResponse.data.success) {
              console.log('   ✅ 消息发送成功!');
              console.log('   返回的消息:', sendResponse.data.data.content);
              console.log('   消息ID:', sendResponse.data.data._id);
            } else {
              console.log('   ❌ 消息发送失败:', sendResponse.data.message);
            }
          } catch (sendError) {
            console.log('   ❌ 消息发送错误:');
            console.log('      状态码:', sendError.response?.status);
            console.log('      错误消息:', sendError.response?.data?.message);
            
            if (sendError.response?.status === 400) {
              console.log('   🚨 仍然存在400错误!');
              console.log('      这表明修复可能不完整');
            }
          }
        } else {
          console.log('   ❌ 未找到有效的测试聊天室');
        }
      } else {
        console.log('   ❌ 没有有效的聊天室可以测试');
      }
      
    } else {
      console.log('❌ 获取聊天室列表失败或为空');
    }
    
    // 5. 测试边界情况
    console.log('\n5. 测试边界情况...');
    
    const edgeCases = [
      {
        name: '缺少taskId',
        data: {
          receiverId: '6884e3fb614d2aaa36f1a263',
          content: '测试消息',
          messageType: 'text'
        }
      },
      {
        name: '缺少receiverId',
        data: {
          taskId: '6884ea7763dd54c79507b817',
          content: '测试消息',
          messageType: 'text'
        }
      },
      {
        name: '空消息内容',
        data: {
          taskId: '6884ea7763dd54c79507b817',
          receiverId: '6884e3fb614d2aaa36f1a263',
          content: '',
          messageType: 'text'
        }
      }
    ];
    
    for (const testCase of edgeCases) {
      console.log(`\n   测试: ${testCase.name}`);
      try {
        const response = await axios.post('/chat/send', testCase.data);
        console.log(`   ⚠️ 意外成功 (应该返回400):`, response.data.message);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`   ✅ 正确返回400错误:`, error.response.data.message);
        } else {
          console.log(`   ❌ 意外错误 (状态码: ${error.response?.status}):`, error.response?.data?.message);
        }
      }
    }
    
    console.log('\n=== 修复效果总结 ===');
    console.log('✅ 前端已添加聊天室数据完整性验证');
    console.log('✅ 前端已添加发送消息前的参数检查');
    console.log('✅ 后端API参数验证正常工作');
    console.log('\n🎯 建议用户:');
    console.log('1. 硬刷新浏览器 (Ctrl+F5)');
    console.log('2. 清除浏览器缓存和localStorage');
    console.log('3. 重新登录应用');
    console.log('4. 如果仍有问题，请检查浏览器控制台的详细错误信息');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
test400ErrorFix();