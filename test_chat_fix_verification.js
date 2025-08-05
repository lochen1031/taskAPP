const axios = require('axios');

// 验证聊天修复效果的测试脚本
async function testChatFixVerification() {
  try {
    console.log('=== 聊天修复验证测试 ===');
    
    // 1. 登录测试用户
    console.log('\n1. 登录测试用户...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testimage@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 2. 测试聊天室API
    console.log('\n2. 测试聊天室API...');
    const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!roomsResponse.data.success) {
      throw new Error('获取聊天室失败: ' + roomsResponse.data.message);
    }
    
    const rooms = roomsResponse.data.data;
    console.log(`✅ 聊天室API正常，返回 ${rooms.length} 个聊天室`);
    
    // 3. 验证聊天室数据完整性
    console.log('\n3. 验证聊天室数据完整性...');
    let validRooms = 0;
    let invalidRooms = 0;
    
    rooms.forEach((room, index) => {
      console.log(`\n聊天室 ${index + 1}:`);
      console.log(`- ID: ${room._id}`);
      console.log(`- task: ${room.task ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`- task._id: ${room.task?._id || '缺失'}`);
      console.log(`- task.title: ${room.task?.title || '缺失'}`);
      console.log(`- otherUser: ${room.otherUser ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`- otherUser._id: ${room.otherUser?._id || '缺失'}`);
      console.log(`- otherUser.username: ${room.otherUser?.username || '缺失'}`);
      
      const isValid = room.task && room.task._id && 
                     room.otherUser && room.otherUser._id;
      
      if (isValid) {
        validRooms++;
        console.log(`- 状态: ✅ 数据完整`);
      } else {
        invalidRooms++;
        console.log(`- 状态: ❌ 数据不完整`);
      }
    });
    
    console.log(`\n数据完整性统计:`);
    console.log(`- 有效聊天室: ${validRooms}`);
    console.log(`- 无效聊天室: ${invalidRooms}`);
    console.log(`- 总计: ${rooms.length}`);
    
    // 4. 测试聊天功能（如果有有效聊天室）
    if (validRooms > 0) {
      console.log('\n4. 测试聊天功能...');
      const firstValidRoom = rooms.find(room => 
        room.task && room.task._id && room.otherUser && room.otherUser._id
      );
      
      if (firstValidRoom) {
        console.log(`使用聊天室: ${firstValidRoom.task.title} - ${firstValidRoom.otherUser.username}`);
        
        // 测试获取聊天消息
        try {
          const messagesResponse = await axios.get(
            `http://localhost:5000/api/chat/room/${firstValidRoom.task._id}/${firstValidRoom.otherUser._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (messagesResponse.data.success) {
            console.log('✅ 获取聊天消息成功');
            console.log(`消息数量: ${messagesResponse.data.data.messages.length}`);
          } else {
            console.log('❌ 获取聊天消息失败:', messagesResponse.data.message);
          }
        } catch (error) {
          console.log('❌ 获取聊天消息出错:', error.response?.data?.message || error.message);
        }
        
        // 测试发送消息
        try {
          const sendResponse = await axios.post('http://localhost:5000/api/chat/send', {
            taskId: firstValidRoom.task._id,
            receiverId: firstValidRoom.otherUser._id,
            content: '测试聊天修复后的消息发送 - ' + new Date().toLocaleTimeString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (sendResponse.data.success) {
            console.log('✅ 发送消息成功');
            console.log(`消息内容: ${sendResponse.data.data.content}`);
          } else {
            console.log('❌ 发送消息失败:', sendResponse.data.message);
          }
        } catch (error) {
          console.log('❌ 发送消息出错:', error.response?.data?.message || error.message);
        }
      }
    } else {
      console.log('\n4. 跳过聊天功能测试（没有有效聊天室）');
    }
    
    // 5. 生成测试聊天链接
    console.log('\n5. 生成测试聊天链接...');
    if (validRooms > 0) {
      const firstValidRoom = rooms.find(room => 
        room.task && room.task._id && room.otherUser && room.otherUser._id
      );
      
      if (firstValidRoom) {
        const chatUrl = `http://localhost:3000/chat?task=${firstValidRoom.task._id}&user=${firstValidRoom.otherUser._id}`;
        console.log('测试聊天链接:');
        console.log(chatUrl);
        console.log('\n请在浏览器中打开上述链接测试聊天功能');
      }
    }
    
    // 6. 总结
    console.log('\n=== 测试总结 ===');
    if (invalidRooms === 0) {
      console.log('✅ 聊天室数据完整性问题已解决');
      console.log('✅ 所有聊天室数据都包含完整的task和otherUser信息');
      console.log('✅ 聊天功能应该可以正常工作');
    } else {
      console.log('⚠️ 仍有部分聊天室数据不完整');
      console.log('建议清理无效的聊天室数据');
    }
    
    console.log('\n建议用户操作:');
    console.log('1. 硬刷新浏览器页面 (Ctrl+F5)');
    console.log('2. 清除浏览器缓存和localStorage');
    console.log('3. 重新登录应用');
    console.log('4. 尝试点击聊天按钮');
    
    return {
      totalRooms: rooms.length,
      validRooms,
      invalidRooms,
      apiWorking: true,
      dataIntegrityFixed: invalidRooms === 0
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return {
      error: error.message,
      apiWorking: false
    };
  }
}

// 运行测试
testChatFixVerification().then(result => {
  console.log('\n测试完成，结果:', result);
}).catch(error => {
  console.error('测试执行失败:', error);
});