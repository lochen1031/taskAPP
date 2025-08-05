const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

// 連接數據庫
mongoose.connect('mongodb://localhost:27017/campus_tasks')
  .then(() => {
    console.log('數據庫連接成功');
    return checkDatabase();
  })
  .catch(err => {
    console.error('數據庫連接失敗:', err);
    process.exit(1);
  });

async function checkDatabase() {
  try {
    console.log('\n=== 檢查數據庫中的任務 ===');
    
    // 獲取所有任務
    const allTasks = await Task.find({}).populate('publisher', 'username');
    console.log('數據庫中總任務數:', allTasks.length);
    
    if (allTasks.length > 0) {
      console.log('\n所有任務:');
      allTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   ID: ${task._id}`);
        console.log(`   狀態: ${task.status}`);
        console.log(`   發布者: ${task.publisher ? task.publisher.username : '未知'}`);
        console.log(`   創建時間: ${task.createdAt}`);
        console.log('---');
      });
    }
    
    // 獲取最近的任務
    const recentTasks = await Task.find({}).sort({ createdAt: -1 }).limit(3).populate('publisher', 'username');
    console.log('\n最近3個任務:');
    recentTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} (${task.status}) - ${task.createdAt}`);
    });
    
    // 檢查用戶
    const users = await User.find({});
    console.log('\n數據庫中用戶數:', users.length);
    
    if (users.length > 0) {
      console.log('\n用戶列表:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('檢查數據庫錯誤:', error);
  } finally {
    mongoose.connection.close();
  }
}