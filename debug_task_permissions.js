const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-task-platform')
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

const Task = require('./models/Task');
const User = require('./models/User');

async function debugTaskPermissions() {
  try {
    console.log('🔍 调试任务权限...');
    
    // 获取测试用户
    const user1 = await User.findOne({ email: 'testimage@example.com' });
    const user2 = await User.findOne({ email: 'test2@example.com' });
    
    if (!user1 || !user2) {
      console.log('❌ 找不到测试用户');
      return;
    }
    
    console.log('用户1 ID:', user1._id.toString());
    console.log('用户2 ID:', user2._id.toString());
    
    // 获取第一个任务
    const task = await Task.findOne().populate('publisher', 'username email').populate('assignee', 'username email');
    
    if (!task) {
      console.log('❌ 找不到任务');
      return;
    }
    
    console.log('\n任务信息:');
    console.log('任务ID:', task._id.toString());
    console.log('发布者:', task.publisher ? `${task.publisher.username} (${task.publisher._id})` : '无');
    console.log('接受者:', task.assignee ? `${task.assignee.username} (${task.assignee._id})` : '无');
    console.log('申请者数量:', task.applicants.length);
    
    if (task.applicants.length > 0) {
      console.log('申请者列表:');
      for (let i = 0; i < task.applicants.length; i++) {
        const applicant = task.applicants[i];
        console.log(`  - ${applicant.user} (状态: ${applicant.status})`);
      }
    }
    
    // 检查用户1的权限
    console.log('\n用户1权限检查:');
    const user1IsPublisher = task.publisher && task.publisher._id.toString() === user1._id.toString();
    const user1IsAssignee = task.assignee && task.assignee._id.toString() === user1._id.toString();
    const user1IsApplicant = task.applicants.some(app => app.user.toString() === user1._id.toString());
    
    console.log('是发布者:', user1IsPublisher);
    console.log('是接受者:', user1IsAssignee);
    console.log('是申请者:', user1IsApplicant);
    
    // 检查用户2的权限
    console.log('\n用户2权限检查:');
    const user2IsPublisher = task.publisher && task.publisher._id.toString() === user2._id.toString();
    const user2IsAssignee = task.assignee && task.assignee._id.toString() === user2._id.toString();
    const user2IsApplicant = task.applicants.some(app => app.user.toString() === user2._id.toString());
    
    console.log('是发布者:', user2IsPublisher);
    console.log('是接受者:', user2IsAssignee);
    console.log('是申请者:', user2IsApplicant);
    
    // 如果用户都不是任务参与者，让用户1申请任务
    if (!user1IsPublisher && !user1IsAssignee && !user1IsApplicant) {
      console.log('\n用户1不是任务参与者，添加为申请者...');
      task.applicants.push({
        user: user1._id,
        appliedAt: new Date(),
        status: 'pending'
      });
      await task.save();
      console.log('✅ 用户1已添加为申请者');
    }
    
    if (!user2IsPublisher && !user2IsAssignee && !user2IsApplicant) {
      console.log('\n用户2不是任务参与者，设置为接受者...');
      task.assignee = user2._id;
      task.status = '進行中';
      await task.save();
      console.log('✅ 用户2已设置为接受者');
    }
    
    console.log('\n✅ 权限调试完成');
    
  } catch (error) {
    console.error('调试错误:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugTaskPermissions();