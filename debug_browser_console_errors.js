// 浏览器控制台错误调试脚本
// 专门用于分析用户报告的400错误和其他网络问题

const axios = require('axios');

// 设置axios基础配置
axios.defaults.baseURL = 'http://localhost:5000/api';

async function debugBrowserConsoleErrors() {
  console.log('=== 浏览器控制台错误调试 ===');
  console.log('时间:', new Date().toLocaleString());
  
  try {
    // 1. 测试后端服务器连接
    console.log('\n1. 测试后端服务器连接...');
    try {
      const healthResponse = await axios.get('/auth/health');
      console.log('✅ 后端服务器连接正常');
    } catch (error) {
      console.log('❌ 后端服务器连接失败:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   原因: 后端服务器未启动或端口5000不可用');
        return;
      }
    }
    
    // 2. 测试用户登录
    console.log('\n2. 测试用户登录...');
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
    
    // 3. 测试获取聊天室列表
    console.log('\n3. 测试获取聊天室列表...');
    const roomsResponse = await axios.get('/chat/rooms');
    
    if (roomsResponse.data.success && roomsResponse.data.data.length > 0) {
      console.log('✅ 获取聊天室列表成功');
      console.log(`   聊天室数量: ${roomsResponse.data.data.length}`);
      
      const testRoom = roomsResponse.data.data[0];
      console.log('   测试聊天室信息:');
      console.log('   - 任务ID:', testRoom.task?._id);
      console.log('   - 任务标题:', testRoom.task?.title);
      console.log('   - 对方用户ID:', testRoom.otherUser?._id);
      console.log('   - 对方用户名:', testRoom.otherUser?.username);
      
      // 4. 测试发送消息 - 重现400错误
      console.log('\n4. 测试发送消息 - 重现400错误...');
      
      if (!testRoom.task?._id || !testRoom.otherUser?._id) {
        console.log('❌ 聊天室数据不完整，无法测试发送消息');
        console.log('   这可能是导致400错误的原因之一');
        return;
      }
      
      // 测试多种消息发送情况
      const testCases = [
        {
          name: '正常消息',
          data: {
            taskId: testRoom.task._id,
            receiverId: testRoom.otherUser._id,
            content: '调试测试消息 - ' + new Date().toLocaleTimeString(),
            messageType: 'text'
          }
        },
        {
          name: '缺少taskId',
          data: {
            receiverId: testRoom.otherUser._id,
            content: '测试消息',
            messageType: 'text'
          }
        },
        {
          name: '缺少receiverId',
          data: {
            taskId: testRoom.task._id,
            content: '测试消息',
            messageType: 'text'
          }
        },
        {
          name: '空消息内容',
          data: {
            taskId: testRoom.task._id,
            receiverId: testRoom.otherUser._id,
            content: '',
            messageType: 'text'
          }
        },
        {
          name: '只有空格的消息',
          data: {
            taskId: testRoom.task._id,
            receiverId: testRoom.otherUser._id,
            content: '   ',
            messageType: 'text'
          }
        }
      ];
      
      for (const testCase of testCases) {
        console.log(`\n   测试案例: ${testCase.name}`);
        try {
          const sendResponse = await axios.post('/chat/send', testCase.data);
          if (sendResponse.data.success) {
            console.log(`   ✅ ${testCase.name} - 发送成功`);
          } else {
            console.log(`   ❌ ${testCase.name} - 发送失败:`, sendResponse.data.message);
          }
        } catch (sendError) {
          console.log(`   ❌ ${testCase.name} - 发送错误:`);
          console.log(`      状态码: ${sendError.response?.status}`);
          console.log(`      错误消息: ${sendError.response?.data?.message}`);
          console.log(`      详细错误: ${sendError.response?.data?.error}`);
          
          if (sendError.response?.status === 400) {
            console.log(`   🎯 发现400错误! 案例: ${testCase.name}`);
            console.log('      请求数据:', JSON.stringify(testCase.data, null, 2));
            console.log('      这可能是前端400错误的原因');
          }
        }
      }
      
    } else {
      console.log('❌ 获取聊天室列表失败或为空');
      console.log('   这可能导致前端无法正常发送消息');
    }
    
    // 5. 检查前端可能的问题
    console.log('\n5. 前端问题分析:');
    console.log('根据浏览器控制台错误，可能的问题包括:');
    console.log('- React Router Future Flag Warning: 路由配置警告');
    console.log('- WebSocket连接失败: Socket.IO连接问题');
    console.log('- 资源加载失败: 图片或其他资源404');
    console.log('- 400错误: 发送消息参数验证失败');
    
    console.log('\n6. 建议解决方案:');
    console.log('1. 清除浏览器缓存和localStorage');
    console.log('2. 硬刷新浏览器 (Ctrl+F5)');
    console.log('3. 检查前端代码中的参数传递');
    console.log('4. 重启前端和后端服务');
    console.log('5. 使用无痕模式测试');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行调试
debugBrowserConsoleErrors();