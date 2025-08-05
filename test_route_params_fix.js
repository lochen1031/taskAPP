// 测试路由参数修复的脚本
// 验证聊天页面是否能正确解析路由参数

const axios = require('axios');

const testRouteParamsFix = async () => {
  console.log('=== 路由参数修复测试 ===\n');
  
  try {
    // 1. 测试登录获取token
    console.log('1. 登录测试用户...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testimage@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 设置axios默认headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. 获取聊天室列表
    console.log('\n2. 获取聊天室列表...');
    const chatRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms');
    
    if (!chatRoomsResponse.data.success) {
      console.log('❌ 获取聊天室失败');
      return;
    }
    
    const chatRooms = chatRoomsResponse.data.data;
    console.log(`✅ 获取到 ${chatRooms.length} 个聊天室`);
    
    if (chatRooms.length === 0) {
      console.log('⚠️ 没有聊天室数据，无法测试路由参数');
      return;
    }
    
    // 3. 验证聊天室数据完整性
    console.log('\n3. 验证聊天室数据完整性...');
    let validRooms = 0;
    
    chatRooms.forEach((room, index) => {
      const hasTask = room.task && room.task._id;
      const hasOtherUser = room.otherUser && room.otherUser._id;
      
      console.log(`聊天室 ${index + 1}:`);
      console.log(`  - 任务: ${hasTask ? '✅' : '❌'} ${room.task?.title || '无标题'}`);
      console.log(`  - 用户: ${hasOtherUser ? '✅' : '❌'} ${room.otherUser?.username || '无用户名'}`);
      console.log(`  - taskId: ${room.task?._id || 'undefined'}`);
      console.log(`  - otherUserId: ${room.otherUser?._id || 'undefined'}`);
      
      if (hasTask && hasOtherUser) {
        validRooms++;
      }
    });
    
    console.log(`\n✅ 有效聊天室数量: ${validRooms}/${chatRooms.length}`);
    
    // 4. 生成测试路由链接
    if (validRooms > 0) {
      console.log('\n4. 生成测试路由链接...');
      
      const firstValidRoom = chatRooms.find(room => 
        room.task && room.task._id && room.otherUser && room.otherUser._id
      );
      
      if (firstValidRoom) {
        const taskId = firstValidRoom.task._id;
        const userId = firstValidRoom.otherUser._id;
        
        // 新的路由格式（修复后）
        const newRouteUrl = `http://localhost:3000/chat/${taskId}/${userId}`;
        
        console.log('🔗 测试链接（新路由格式）:');
        console.log(newRouteUrl);
        
        console.log('\n📋 路由参数信息:');
        console.log(`  - taskId: ${taskId}`);
        console.log(`  - userId: ${userId}`);
        console.log(`  - 任务标题: ${firstValidRoom.task.title}`);
        console.log(`  - 用户名: ${firstValidRoom.otherUser.username}`);
        
        // 5. 测试聊天室API
        console.log('\n5. 测试聊天室API...');
        try {
          const messagesResponse = await axios.get(`http://localhost:5000/api/chat/room/${taskId}/${userId}`);
          
          if (messagesResponse.data.success) {
            console.log('✅ 聊天室API正常');
            console.log(`  - 消息数量: ${messagesResponse.data.data.messages.length}`);
          } else {
            console.log('❌ 聊天室API失败:', messagesResponse.data.message);
          }
        } catch (error) {
          console.log('❌ 聊天室API错误:', error.response?.data?.message || error.message);
        }
      }
    }
    
    // 6. 总结
    console.log('\n=== 测试总结 ===');
    console.log('✅ 修复内容:');
    console.log('  - 将URLSearchParams改为useParams');
    console.log('  - 从查询参数改为路由参数');
    console.log('  - 路由格式: /chat/:taskId/:userId');
    
    console.log('\n🔧 使用说明:');
    console.log('1. 确保前端应用在 http://localhost:3000 运行');
    console.log('2. 点击上面的测试链接');
    console.log('3. 检查浏览器控制台是否还有 "otherUserId: undefined" 错误');
    console.log('4. 如果没有错误，说明修复成功');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
  }
};

// 运行测试
testRouteParamsFix().catch(console.error);