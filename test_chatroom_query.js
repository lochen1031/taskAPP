const mongoose = require('mongoose');
const Message = require('./models/Message');
const axios = require('axios');

// 测试聊天室查询问题
async function testChatroomQuery() {
    console.log('=== 测试聊天室查询问题 ===\n');
    
    try {
        // 1. 连接数据库
        await mongoose.connect('mongodb://localhost:27017/campus_tasks');
        console.log('✅ 数据库连接成功');
        
        // 2. 登录获取用户ID
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testimage@example.com',
            password: 'password123'
        });
        
        const userId = loginResponse.data.user._id;
        console.log('用户ID:', userId);
        console.log('用户ID类型:', typeof userId);
        
        // 3. 转换为ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        console.log('ObjectId:', userObjectId);
        
        // 4. 查询所有相关消息
        console.log('\n=== 查询所有相关消息 ===');
        const allMessages = await Message.find({
            $or: [
                { sender: userObjectId },
                { receiver: userObjectId }
            ],
            isDeleted: false
        }).select('chatRoom sender receiver task createdAt content');
        
        console.log('找到消息数量:', allMessages.length);
        
        if (allMessages.length > 0) {
            console.log('\n最新消息:');
            allMessages.slice(0, 3).forEach((msg, index) => {
                console.log(`${index + 1}. 聊天室: ${msg.chatRoom}`);
                console.log(`   发送者: ${msg.sender}`);
                console.log(`   接收者: ${msg.receiver}`);
                console.log(`   内容: ${msg.content}`);
                console.log(`   时间: ${msg.createdAt}`);
                console.log('');
            });
        }
        
        // 5. 测试聚合查询（修复版本）
        console.log('=== 测试聚合查询（修复版本） ===');
        const chatRooms = await Message.aggregate([
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
                $sort: { lastMessageTime: -1 }
            }
        ]);
        
        console.log('聊天室数量:', chatRooms.length);
        
        if (chatRooms.length > 0) {
            console.log('\n聊天室列表:');
            chatRooms.forEach((room, index) => {
                console.log(`${index + 1}. 聊天室ID: ${room._id}`);
                console.log(`   最后消息: ${room.lastMessage}`);
                console.log(`   最后消息时间: ${room.lastMessageTime}`);
                console.log(`   任务ID: ${room.task}`);
                console.log(`   对方用户ID: ${room.otherUser}`);
                console.log(`   未读数量: ${room.unreadCount}`);
                console.log('');
            });
        }
        
        // 6. 测试原始聚合查询（问题版本）
        console.log('=== 测试原始聚合查询（问题版本） ===');
        const originalChatRooms = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId }, // 这里使用字符串而不是ObjectId
                        { receiver: userId }
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
                                { $eq: ['$sender', userId] }, // 这里也使用字符串
                                '$receiver',
                                '$sender'
                            ]
                        }
                    }
                }
            }
        ]);
        
        console.log('原始查询聊天室数量:', originalChatRooms.length);
        
        // 7. 显示修复建议
        console.log('\n=== 修复建议 ===');
        if (chatRooms.length > originalChatRooms.length) {
            console.log('✅ 问题确认：需要将userId转换为ObjectId');
            console.log('修复方法：在聚合查询中使用 new mongoose.Types.ObjectId(req.userId)');
        } else {
            console.log('❓ 可能还有其他问题需要进一步调查');
        }
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n数据库连接已关闭');
    }
}

// 运行测试
testChatroomQuery();