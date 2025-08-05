const axios = require('axios');
const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

// 設置axios基礎URL
axios.defaults.baseURL = 'http://localhost:5000/api';

async function testFullFlow() {
  try {
    console.log('開始測試完整流程...');
    
    // 1. 註冊用戶
    console.log('\n1. 註冊測試用戶...');
    const registerData = {
      username: 'test' + Math.floor(Math.random() * 1000),
      email: 'test' + Date.now() + '@example.com',
      password: '123456',
      university: '測試大學',
      major: '計算機科學',
      grade: '大三'
    };
    
    let registerResponse;
    try {
      registerResponse = await axios.post('/auth/register', registerData);
      console.log('註冊成功:', registerResponse.data.message);
    } catch (error) {
      console.log('註冊失敗:', error.response?.data?.message || error.message);
      return;
    }
    
    // 2. 登錄用戶
    console.log('\n2. 登錄用戶...');
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };
    
    let loginResponse;
    try {
      loginResponse = await axios.post('/auth/login', loginData);
      console.log('登錄成功:', loginResponse.data.message);
      
      // 設置認證token
      const token = loginResponse.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.log('登錄失敗:', error.response?.data?.message || error.message);
      return;
    }
    
    // 3. 發布任務
    console.log('\n3. 發布測試任務...');
    const taskData = {
      title: '測試任務 - ' + new Date().toLocaleString(),
      description: '這是一個測試任務，用於驗證發布和顯示功能',
      category: '學習輔導',
      priority: '中',
      reward: 100,
      location: '圖書館',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天後
      requirements: '需要有相關經驗',
      contactInfo: {
        phone: '13800138000',
        wechat: 'test_wechat'
      },
      estimatedTime: 2
    };
    
    let publishResponse;
    try {
      console.log('發送的任務數據:', JSON.stringify(taskData, null, 2));
      publishResponse = await axios.post('/tasks', taskData);
      console.log('任務發布成功:', publishResponse.data.message);
      console.log('任務ID:', publishResponse.data.data._id);
      console.log('任務狀態:', publishResponse.data.data.status);
      console.log('完整響應:', JSON.stringify(publishResponse.data, null, 2));
    } catch (error) {
      console.log('任務發布失敗:', error.response?.data?.message || error.message);
      console.log('錯誤詳情:', error.response?.data?.error);
      console.log('完整錯誤響應:', JSON.stringify(error.response?.data, null, 2));
      return;
    }
    
    // 4. 獲取任務列表（驗證任務是否顯示）
    console.log('\n4. 獲取任務列表...');
    try {
      const tasksResponse = await axios.get('/tasks?status=待接取&limit=20');
      console.log('任務列表獲取成功');
      console.log('總任務數:', tasksResponse.data.data.total);
      console.log('我們發布的任務ID:', publishResponse.data.data._id);
      
      const tasks = tasksResponse.data.data.tasks;
      console.log('\n任務列表:');
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title} (狀態: ${task.status}, 發布者: ${task.publisher.username}, ID: ${task._id})`);
      });
      
      // 檢查我們剛發布的任務是否在列表中
      const ourTask = tasks.find(task => task._id === publishResponse.data.data._id);
      if (ourTask) {
        console.log('\n✅ 成功！剛發布的任務已在任務大廳中顯示');
      } else {
        console.log('\n❌ 問題：剛發布的任務未在任務大廳中顯示');
        console.log('嘗試不帶狀態篩選獲取任務...');
        
        // 嘗試不帶狀態篩選
        const allTasksResponse = await axios.get('/tasks?limit=20');
        const allTasks = allTasksResponse.data.data.tasks;
        console.log('\n所有任務:');
        allTasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title} (狀態: ${task.status}, ID: ${task._id})`);
        });
        
        const ourTaskInAll = allTasks.find(task => task._id === publishResponse.data.data._id);
        if (ourTaskInAll) {
          console.log('\n✅ 任務存在於所有任務列表中，狀態為:', ourTaskInAll.status);
        } else {
          console.log('\n❌ 任務在所有任務列表中也找不到');
        }
      }
    } catch (error) {
      console.log('獲取任務列表失敗:', error.response?.data?.message || error.message);
    }
    
    // 5. 獲取我的任務（驗證在我的任務中是否顯示）
    console.log('\n5. 獲取我的發布任務...');
    try {
      const myTasksResponse = await axios.get('/tasks/my/published');
      console.log('我的任務獲取成功');
      console.log('響應數據:', JSON.stringify(myTasksResponse.data, null, 2));
      
      const myTasks = myTasksResponse.data.data || myTasksResponse.data;
      if (Array.isArray(myTasks)) {
        console.log('我發布的任務數:', myTasks.length);
        
        console.log('\n我的發布任務:');
        myTasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title} (狀態: ${task.status})`);
        });
        
        // 檢查我們剛發布的任務是否在我的任務中
        const ourTask = myTasks.find(task => task._id === publishResponse.data.data._id);
        if (ourTask) {
          console.log('\n✅ 成功！剛發布的任務已在"我的任務"中顯示');
        } else {
          console.log('\n❌ 問題：剛發布的任務未在"我的任務"中顯示');
        }
      } else {
        console.log('我的任務數據格式錯誤:', typeof myTasks);
      }
    } catch (error) {
      console.log('獲取我的任務失敗:', error.response?.data?.message || error.message);
    }
    
    console.log('\n測試完成！');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error.message);
  }
}

// 運行測試
testFullFlow();