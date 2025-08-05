// 立即修復400錯誤的測試腳本
const axios = require('axios');

// 配置axios（與前端保持一致）
axios.defaults.baseURL = 'http://localhost:5000/api';

async function immediate400Fix() {
  console.log('=== 立即修復400錯誤 ===\n');
  
  try {
    // 1. 測試後端健康狀態
    console.log('1. 檢查後端服務器狀態...');
    const healthResponse = await axios.get('/', {
      baseURL: 'http://localhost:5000'
    });
    console.log('✅ 後端服務器正常:', healthResponse.data.message);
    
    // 2. 測試登錄
    console.log('\n2. 測試用戶登錄...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登錄失敗:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ 登錄成功');
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user._id;
    
    // 設置認證頭
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 3. 獲取聊天室
    console.log('\n3. 獲取聊天室列表...');
    const roomsResponse = await axios.get('/chat/rooms');
    
    if (!roomsResponse.data.success || roomsResponse.data.data.length === 0) {
      console.log('❌ 沒有可用的聊天室');
      return;
    }
    
    const chatroom = roomsResponse.data.data[0];
    console.log('✅ 找到聊天室:', {
      taskId: chatroom.task._id,
      receiverId: chatroom.otherUser._id,
      taskTitle: chatroom.task.title
    });
    
    // 4. 測試各種消息發送情況
    console.log('\n4. 測試消息發送...');
    
    const testCases = [
      {
        name: '正常消息',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '測試消息 - ' + new Date().toLocaleTimeString(),
          messageType: 'text'
        },
        shouldSucceed: true
      },
      {
        name: '空消息',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '',
          messageType: 'text'
        },
        shouldSucceed: false
      },
      {
        name: '只有空格的消息',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '   ',
          messageType: 'text'
        },
        shouldSucceed: false
      },
      {
        name: '缺少taskId',
        data: {
          receiverId: chatroom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        },
        shouldSucceed: false
      },
      {
        name: '缺少receiverId',
        data: {
          taskId: chatroom.task._id,
          content: '測試消息',
          messageType: 'text'
        },
        shouldSucceed: false
      }
    ];
    
    let passedTests = 0;
    
    for (const testCase of testCases) {
      try {
        console.log(`\n測試: ${testCase.name}`);
        console.log('發送數據:', JSON.stringify(testCase.data, null, 2));
        
        const response = await axios.post('/chat/send', testCase.data);
        
        if (testCase.shouldSucceed) {
          console.log('✅ 測試通過 - 消息發送成功');
          passedTests++;
        } else {
          console.log('❌ 測試失敗 - 預期失敗但實際成功');
        }
        
      } catch (error) {
        if (!testCase.shouldSucceed) {
          console.log('✅ 測試通過 - 預期失敗:', error.response?.data?.message || error.message);
          passedTests++;
        } else {
          console.log('❌ 測試失敗 - 預期成功但實際失敗');
          console.log('錯誤詳情:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
          });
          
          // 如果是400錯誤，提供詳細分析
          if (error.response?.status === 400) {
            console.log('\n🔍 400錯誤分析:');
            console.log('- 請求URL:', error.config?.url);
            console.log('- 請求方法:', error.config?.method);
            console.log('- 請求頭:', error.config?.headers);
            console.log('- 請求體:', error.config?.data);
            console.log('- 響應數據:', error.response?.data);
          }
        }
      }
    }
    
    console.log(`\n📊 測試結果: ${passedTests}/${testCases.length} 通過`);
    
    if (passedTests === testCases.length) {
      console.log('\n🎉 所有測試通過！後端API工作正常。');
      console.log('\n💡 如果前端仍有400錯誤，請嘗試:');
      console.log('1. 硬刷新瀏覽器 (Ctrl+F5)');
      console.log('2. 清除瀏覽器緩存和localStorage');
      console.log('3. 重新登錄');
      console.log('4. 檢查瀏覽器控制台的網絡請求詳情');
    } else {
      console.log('\n⚠️ 部分測試失敗，需要進一步調試。');
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:');
    console.error('錯誤消息:', error.message);
    
    if (error.response) {
      console.error('響應狀態:', error.response.status);
      console.error('響應數據:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 連接被拒絕，請檢查:');
      console.error('1. 後端服務器是否正在運行 (node server.js)');
      console.error('2. 端口5000是否被佔用');
      console.error('3. 防火牆設置');
    }
  }
}

// 運行測試
immediate400Fix();