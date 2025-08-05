// 最終400錯誤測試腳本
// 測試修復後的消息發送功能

const axios = require('axios');

// 配置axios
axios.defaults.baseURL = 'http://localhost:5000/api';

async function finalTest() {
  console.log('=== 最終400錯誤測試 ===');
  
  try {
    // 1. 登錄獲取token
    console.log('\n1. 登錄獲取token...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'demo@example.com',
      password: '123456'
    });
    
    let token, user;
    if (loginResponse.data && loginResponse.data.success) {
      token = loginResponse.data.token;
      user = loginResponse.data.user;
    } else if (loginResponse.data && loginResponse.data.data) {
      token = loginResponse.data.data.token;
      user = loginResponse.data.data.user;
    } else {
      token = loginResponse.data.token;
      user = loginResponse.data.user;
    }
    
    if (!token) {
      console.log('❌ 登錄失敗');
      return;
    }
    
    console.log('✅ 登錄成功');
    
    // 2. 設置認證頭
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 3. 獲取聊天室
    console.log('\n2. 獲取聊天室...');
    const roomsResponse = await axios.get('/chat/rooms');
    
    if (!roomsResponse.data.success || roomsResponse.data.data.length === 0) {
      console.log('❌ 沒有聊天室');
      return;
    }
    
    const chatroom = roomsResponse.data.data[0];
    console.log('✅ 找到聊天室');
    
    // 4. 測試各種消息發送情況
    console.log('\n3. 測試消息發送...');
    
    const testCases = [
      {
        name: '正常消息',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '這是一條正常的測試消息',
          messageType: 'text'
        },
        expectSuccess: true
      },
      {
        name: '空字符串',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '只有空格',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '   ',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '只有換行',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '\n\n',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '空格和換行混合',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '  \n  \t  ',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '有效內容前後有空格',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          content: '  有效消息  ',
          messageType: 'text'
        },
        expectSuccess: true
      },
      {
        name: '缺少taskId',
        data: {
          receiverId: chatroom.otherUser._id,
          content: '測試消息',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '缺少receiverId',
        data: {
          taskId: chatroom.task._id,
          content: '測試消息',
          messageType: 'text'
        },
        expectSuccess: false
      },
      {
        name: '缺少content',
        data: {
          taskId: chatroom.task._id,
          receiverId: chatroom.otherUser._id,
          messageType: 'text'
        },
        expectSuccess: false
      }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n測試: ${testCase.name}`);
      console.log('發送數據:', JSON.stringify(testCase.data, null, 2));
      console.log('預期結果:', testCase.expectSuccess ? '成功' : '失敗');
      
      try {
        const response = await axios.post('/chat/send', testCase.data);
        
        if (testCase.expectSuccess) {
          console.log('✅ 測試通過: 成功發送消息');
          console.log('響應:', response.data.message);
          passedTests++;
        } else {
          console.log('❌ 測試失敗: 預期失敗但成功了');
          console.log('響應:', response.data);
        }
        
      } catch (error) {
        if (!testCase.expectSuccess) {
          console.log('✅ 測試通過: 正確拒絕了無效請求');
          console.log('錯誤:', error.response?.data?.message || error.message);
          passedTests++;
        } else {
          console.log('❌ 測試失敗: 預期成功但失敗了');
          console.log('錯誤:', error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log(`\n=== 測試結果 ===`);
    console.log(`通過: ${passedTests}/${totalTests}`);
    console.log(`成功率: ${(passedTests/totalTests*100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有測試通過！400錯誤問題已修復');
    } else {
      console.log('⚠️ 部分測試失敗，需要進一步檢查');
    }
    
  } catch (error) {
    console.log('❌ 測試過程中發生錯誤:', error.message);
  }
}

// 運行測試
finalTest().catch(console.error);