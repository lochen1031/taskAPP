const axios = require('axios');

// 测试聊天室数据结构
async function debugChatroomData() {
    console.log('=== 调试聊天室数据结构 ===\n');
    
    try {
        // 1. 登录获取token
        console.log('1. 登录获取token...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testimage@example.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.log('登录失败:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user._id;
        console.log('登录成功，用户ID:', userId);
        
        // 2. 获取聊天室列表
        console.log('\n2. 获取聊天室列表...');
        const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (roomsResponse.data.success) {
            const rooms = roomsResponse.data.data;
            console.log('聊天室数量:', rooms.length);
            
            rooms.forEach((room, index) => {
                console.log(`\n聊天室 ${index + 1}:`);
                console.log('  _id:', room._id);
                console.log('  lastMessage:', room.lastMessage);
                console.log('  lastMessageTime:', room.lastMessageTime);
                console.log('  task:', {
                    _id: room.task?._id,
                    title: room.task?.title,
                    status: room.task?.status
                });
                console.log('  otherUser:', {
                    _id: room.otherUser?._id,
                    username: room.otherUser?.username,
                    avatar: room.otherUser?.avatar
                });
                console.log('  unreadCount:', room.unreadCount);
                
                // 检查数据完整性
                if (!room.task) {
                    console.log('  ❌ 任务数据缺失');
                }
                if (!room.otherUser) {
                    console.log('  ❌ 用户数据缺失');
                }
                if (!room.otherUser?.username) {
                    console.log('  ❌ 用户名缺失');
                }
            });
            
            // 3. 检查原始聊天室数据（不经过populate）
            console.log('\n3. 检查原始聊天室数据...');
            const Message = require('./models/Message');
            const mongoose = require('mongoose');
            
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_tasks');
            
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const rawRooms = await Message.aggregate([
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
                        task: { $last: '$task' },
                        otherUser: {
                            $last: {
                                $cond: [
                                    { $eq: ['$sender', userObjectId] },
                                    '$receiver',
                                    '$sender'
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: { lastMessageTime: -1 }
                }
            ]);
            
            console.log('\n原始聚合结果:');
            rawRooms.forEach((room, index) => {
                console.log(`原始聊天室 ${index + 1}:`);
                console.log('  _id:', room._id);
                console.log('  task ObjectId:', room.task);
                console.log('  otherUser ObjectId:', room.otherUser);
                console.log('  lastMessage:', room.lastMessage);
            });
            
            await mongoose.disconnect();
            
        } else {
            console.log('❌ 获取聊天室失败:', roomsResponse.data.message);
        }
        
    } catch (error) {
        console.error('调试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行调试
debugChatroomData();