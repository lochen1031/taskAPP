const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

async function testTaskSave() {
  try {
    // 連接數據庫
    await mongoose.connect('mongodb://localhost:27017/campus_tasks');
    console.log('數據庫連接成功');
    
    // 查找一個測試用戶
    const users = await User.find();
    console.log('數據庫中用戶數:', users.length);
    
    const user = users[0];
    if (!user) {
      console.log('沒有找到用戶，請先註冊一個用戶');
      return;
    }
    
    console.log('使用用戶:', user.username, user._id);
    
    // 創建任務數據
    const taskData = {
      title: '直接測試任務 - ' + new Date().toLocaleString(),
      description: '這是一個直接保存到數據庫的測試任務',
      category: '學習輔導',
      publisher: user._id,
      reward: 50,
      location: '測試地點',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天後
      requirements: '測試要求',
      contactInfo: {
        phone: '13800138000',
        wechat: 'test_wechat'
      },
      estimatedTime: 2
    };
    
    console.log('\n準備保存任務數據:', JSON.stringify(taskData, null, 2));
    
    // 創建並保存任務
    const task = new Task(taskData);
    console.log('\n任務對象創建成功，準備保存...');
    
    const savedTask = await task.save();
    console.log('\n任務保存成功!');
    console.log('保存的任務ID:', savedTask._id);
    console.log('保存的任務狀態:', savedTask.status);
    
    // 立即查詢驗證
    console.log('\n立即查詢驗證...');
    const foundTask = await Task.findById(savedTask._id);
    if (foundTask) {
      console.log('✅ 驗證成功：任務已保存到數據庫');
      console.log('查詢到的任務:', foundTask.title);
    } else {
      console.log('❌ 驗證失敗：任務未找到');
    }
    
    // 查詢所有任務
    console.log('\n查詢所有任務...');
    const allTasks = await Task.find();
    console.log('數據庫中總任務數:', allTasks.length);
    
    if (allTasks.length > 0) {
      console.log('\n最近的任務:');
      allTasks.slice(-3).forEach((task, index) => {
        console.log(`${index + 1}. ${task.title} (狀態: ${task.status}, ID: ${task._id})`);
      });
    }
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
    console.error('錯誤詳情:', error.message);
    if (error.errors) {
      console.error('驗證錯誤:', error.errors);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n數據庫連接已關閉');
  }
}

// 運行測試
testTaskSave();