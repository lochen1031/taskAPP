const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const Task = require('./models/Task');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/campus_tasks', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugOtherUserIssue() {
  try {
    console.log('=== 调试 otherUser 问题 ===');
    
    // 获取一个测试用户
    const testUser = await User.findOne({ username: 'testuser0' });
    if (!testUser) {
      console.log('未找到测试用户');
      return;
    }
    
    console.log('当前用户:', testUser.username, testUser._id);
    
    const userObjectId = new mongoose.Types.ObjectId(testUser._id);
    
    // 使用当前的聚合查询逻辑
    console.log('\n=== 当前聚合查询结果 ===');
    const currentResult = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId }
          ],
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$chatRoom',
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          lastMessageType: { $last: '$messageType' },
          task: { $last: '$task' },
          otherUser: {
            $last: {
              $cond: [
                { $eq: ['$sender', userObjectId] },
                '$receiver',
                '$sender'
              ]
            }
          },
          allSenders: { $addToSet: '$sender' },
          allReceivers: { $addToSet: '$receiver' }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);
    
    for (const room of currentResult) {
      console.log('\n聊天室:', room._id);
      console.log('所有发送者:', room.allSenders);
      console.log('所有接收者:', room.allReceivers);
      console.log('当前 otherUser ID:', room.otherUser);
      
      // 获取用户信息
      const otherUser = await User.findById(room.otherUser);
      console.log('otherUser 用户名:', otherUser?.username);
      
      // 正确的 otherUser 应该是参与者中不是当前用户的那个
      const allParticipants = [...new Set([...room.allSenders, ...room.allReceivers])];
      const correctOtherUser = allParticipants.find(id => !id.equals(userObjectId));
      const correctUser = await User.findById(correctOtherUser);
      console.log('正确的 otherUser ID:', correctOtherUser);
      console.log('正确的 otherUser 用户名:', correctUser?.username);
      
      console.log('是否一致:', room.otherUser.equals(correctOtherUser));
    }
    
    // 修正后的聚合查询
    console.log('\n=== 修正后的聚合查询结果 ===');
    const fixedResult = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId }
          ],
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$chatRoom',
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          lastMessageType: { $last: '$messageType' },
          task: { $last: '$task' },
          participants: {
            $addToSet: {
              $cond: [
                { $eq: ['$sender', userObjectId] },
                '$receiver',
                '$sender'
              ]
            }
          },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userObjectId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          otherUser: { $arrayElemAt: ['$participants', 0] }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);
    
    for (const room of fixedResult) {
      console.log('\n修正后聊天室:', room._id);
      console.log('otherUser ID:', room.otherUser);
      
      const otherUser = await User.findById(room.otherUser);
      console.log('otherUser 用户名:', otherUser?.username);
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugOtherUserIssue();