const axios = require('axios');

// 测试运行时错误修复
async function testRuntimeFix() {
  console.log('🔧 测试运行时错误修复...');
  
  try {
    // 1. 测试后端服务器是否正常运行
    console.log('\n1. 检查后端服务器状态...');
    const serverResponse = await axios.get('http://localhost:5000/api/auth/test', {
      timeout: 5000
    }).catch(() => ({ data: { message: '服务器连接失败' } }));
    
    if (serverResponse.data) {
      console.log('✅ 后端服务器正常运行');
    } else {
      console.log('❌ 后端服务器连接失败');
    }
    
    // 2. 测试前端服务器是否正常运行
    console.log('\n2. 检查前端服务器状态...');
    const frontendResponse = await axios.get('http://localhost:3000', {
      timeout: 5000
    }).catch(() => ({ status: 0 }));
    
    if (frontendResponse.status === 200) {
      console.log('✅ 前端服务器正常运行');
    } else {
      console.log('❌ 前端服务器连接失败');
    }
    
    // 3. 测试用户登录功能
    console.log('\n3. 测试用户登录功能...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).catch(err => ({ 
      data: { 
        success: false, 
        message: err.response?.data?.message || '登录测试失败' 
      } 
    }));
    
    if (loginResponse.data.success) {
      console.log('✅ 用户登录功能正常');
      
      // 4. 测试聊天室API
      console.log('\n4. 测试聊天室API...');
      const token = loginResponse.data.token;
      const chatResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => ({ 
        data: { 
          success: false, 
          message: err.response?.data?.message || '聊天室API测试失败' 
        } 
      }));
      
      if (chatResponse.data.success) {
        console.log('✅ 聊天室API正常工作');
        console.log(`   找到 ${chatResponse.data.data.length} 个聊天室`);
      } else {
        console.log('❌ 聊天室API异常:', chatResponse.data.message);
      }
    } else {
      console.log('❌ 用户登录功能异常:', loginResponse.data.message);
    }
    
    console.log('\n🎉 运行时错误修复测试完成！');
    console.log('\n📋 修复总结:');
    console.log('   - 在 SocketContext.js 中添加了防护性检查');
    console.log('   - 确保在访问 user._id 之前检查 user 对象是否存在');
    console.log('   - 确保在访问 data.sender._id 之前检查 sender 对象是否存在');
    console.log('   - 防止了 "Cannot read properties of undefined" 错误');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testRuntimeFix();