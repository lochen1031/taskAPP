const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 修复用户名显示问题
async function fixUsernameDisplay() {
  console.log('=== 修复用户名显示问题 ===\n');
  
  try {
    // 1. 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_tasks');
    console.log('✅ 数据库连接成功');
    
    const User = require('./models/User');
    const Message = require('./models/Message');
    
    // 2. 检查所有用户数据
    console.log('\n1. 检查用户数据完整性...');
    const users = await User.find({}, 'username email avatar').lean();
    console.log(`找到 ${users.length} 个用户:`);
    
    let usersWithoutUsername = 0;
    users.forEach(user => {
      if (!user.username || user.username.trim() === '') {
        console.log(`❌ 用户 ${user._id} 缺少用户名:`, user);
        usersWithoutUsername++;
      } else {
        console.log(`✅ ${user.username} (${user.email})`);
      }
    });
    
    if (usersWithoutUsername > 0) {
      console.log(`\n⚠️ 发现 ${usersWithoutUsername} 个用户缺少用户名，需要修复`);
      
      // 修复缺少用户名的用户
      for (const user of users) {
        if (!user.username || user.username.trim() === '') {
          const newUsername = `user_${user._id.toString().slice(-8)}`;
          await User.findByIdAndUpdate(user._id, { username: newUsername });
          console.log(`✅ 已为用户 ${user._id} 设置用户名: ${newUsername}`);
        }
      }
    }
    
    // 3. 测试聊天室API
    console.log('\n2. 测试聊天室API...');
    
    // 先检查用户的实际邮箱
    const testUser = await User.findOne({ username: 'testuser_image' });
    console.log('找到测试用户:', testUser ? { username: testUser.username, email: testUser.email } : '未找到');
    
    // 登录测试用户
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser ? testUser.email : 'testimage@example.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功:', loginResponse.data.data.username);
      
      const token = loginResponse.data.token;
      
      // 获取聊天室数据
      const chatRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (chatRoomsResponse.data.success) {
        console.log(`\n✅ 获取到 ${chatRoomsResponse.data.data.length} 个聊天室:`);
        
        chatRoomsResponse.data.data.forEach((room, index) => {
          console.log(`\n聊天室 ${index + 1}:`);
          console.log(`  任务: ${room.task?.title || 'N/A'}`);
          console.log(`  用户ID: ${room.otherUser?._id || 'N/A'}`);
          console.log(`  用户名: "${room.otherUser?.username || 'N/A'}"`); 
          console.log(`  头像: ${room.otherUser?.avatar || 'N/A'}`);
          
          if (!room.otherUser?.username) {
            console.log('  ❌ 用户名缺失!');
          } else {
            console.log('  ✅ 用户名正常');
          }
        });
        
        // 4. 生成前端测试代码
        console.log('\n3. 前端测试代码:');
        console.log('请在浏览器控制台运行以下代码来检查前端数据:');
        console.log('\n```javascript');
        console.log('// 检查聊天室数据');
        console.log('fetch("/chat/rooms", { credentials: "include" })');
        console.log('  .then(res => res.json())');
        console.log('  .then(data => {');
        console.log('    console.log("聊天室数据:", data);');
        console.log('    if (data.success) {');
        console.log('      data.data.forEach((room, i) => {');
        console.log('        console.log(`聊天室 ${i+1}:`, {');
        console.log('          taskTitle: room.task?.title,');
        console.log('          username: room.otherUser?.username,');
        console.log('          hasUsername: !!room.otherUser?.username');
        console.log('        });');
        console.log('      });');
        console.log('    }');
        console.log('  });');
        console.log('```\n');
        
        // 5. 检查是否有前端缓存问题
        console.log('4. 前端缓存清理建议:');
        console.log('如果用户名仍显示为"未知用户"，请尝试:');
        console.log('1. 硬刷新页面 (Ctrl+F5 或 Cmd+Shift+R)');
        console.log('2. 清除浏览器缓存和Cookie');
        console.log('3. 在浏览器控制台运行: localStorage.clear(); sessionStorage.clear();');
        console.log('4. 重新登录');
        
      } else {
        console.log('❌ 获取聊天室失败:', chatRoomsResponse.data);
      }
      
    } else {
      console.log('❌ 登录失败，尝试其他用户...');
      
      // 尝试登录其他用户
      const testUsers = [
        { email: 'demo@example.com', password: '123456' },
        { email: 'test@example.com', password: '123456' }
      ];
      
      for (const testUser of testUsers) {
        try {
          const response = await axios.post('http://localhost:5000/api/auth/login', testUser);
          if (response.data.success) {
            console.log('✅ 登录成功:', response.data.user.username);
            break;
          }
        } catch (error) {
          console.log(`❌ 登录失败 ${testUser.email}:`, error.response?.data?.message || error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  } finally {
    mongoose.connection.close();
  }
}

fixUsernameDisplay();