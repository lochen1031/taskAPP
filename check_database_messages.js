const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const Task = require('./models/Task');

// 检查数据库中的消息
async function checkDatabaseMessages() {
    console.log('=== 检查数据库中的消息 ===\n');
    
    try {
        // 1. 连接数据库
        await mongoose.connect('mongodb://localhost:27017/campus_tasks');
        console.log('✅ 数据库连接成功');
        
        // 2. 查询所有消息
        console.log('\n=== 查询所有消息 ===');
        const allMessages = await Message.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('数据库中总消息数量:', await Message.countDocuments({}));
        
        if (allMessages.length > 0) {
            console.log('\n最新10条消息:');
            for (let i = 0; i < allMessages.length; i++) {
                const msg = allMessages[i];
                console.log(`${i + 1}. ID: ${msg._id}`);
                console.log(`   聊天室: ${msg.chatRoom}`);
                console.log(`   发送者: ${msg.sender}`);
                console.log(`   接收者: ${msg.receiver}`);
                console.log(`   任务: ${msg.task}`);
                console.log(`   内容: ${msg.content}`);
                console.log(`   类型: ${msg.messageType}`);
                console.log(`   已读: ${msg.isRead}`);
                console.log(`   已删除: ${msg.isDeleted}`);
                console.log(`   创建时间: ${msg.createdAt}`);
                console.log('');
            }
        } else {
            console.log('❌ 数据库中没有任何消息');
        }
        
        // 3. 查询所有用户
        console.log('=== 查询所有用户 ===');
        const allUsers = await User.find({}).select('_id username email');
        console.log('用户数量:', allUsers.length);
        
        if (allUsers.length > 0) {
            console.log('\n用户列表:');
            allUsers.forEach((user, index) => {
                console.log(`${index + 1}. ID: ${user._id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
            });
        }
        
        // 4. 查询所有任务
        console.log('\n=== 查询所有任务 ===');
        const allTasks = await Task.find({}).select('_id title publisher assignee applicants').populate('publisher', 'username').populate('assignee', 'username');
        console.log('任务数量:', allTasks.length);
        
        if (allTasks.length > 0) {
            console.log('\n任务列表:');
            allTasks.slice(0, 5).forEach((task, index) => {
                console.log(`${index + 1}. ID: ${task._id}`);
                console.log(`   标题: ${task.title}`);
                console.log(`   发布者: ${task.publisher?.username || task.publisher}`);
                console.log(`   接受者: ${task.assignee?.username || task.assignee || '无'}`);
                console.log(`   申请者数量: ${task.applicants?.length || 0}`);
                console.log('');
            });
        }
        
        // 5. 检查特定用户的消息
        const testUserId = '6884e3fb614d2aaa36f1a263';
        console.log(`=== 检查用户 ${testUserId} 的消息 ===`);
        
        const userMessages = await Message.find({
            $or: [
                { sender: new mongoose.Types.ObjectId(testUserId) },
                { receiver: new mongoose.Types.ObjectId(testUserId) }
            ]
        });
        
        console.log('该用户相关消息数量:', userMessages.length);
        
        // 6. 检查消息集合是否存在
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n=== 数据库集合列表 ===');
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });
        
        const messageCollection = collections.find(col => col.name === 'messages');
        if (messageCollection) {
            console.log('\n✅ messages集合存在');
            const messageCount = await mongoose.connection.db.collection('messages').countDocuments();
            console.log('messages集合中的文档数量:', messageCount);
        } else {
            console.log('\n❌ messages集合不存在');
        }
        
    } catch (error) {
        console.error('检查过程中发生错误:', error.message);
        console.error('错误详情:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n数据库连接已关闭');
    }
}

// 运行检查
checkDatabaseMessages();