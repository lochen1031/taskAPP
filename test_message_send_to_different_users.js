const axios = require('axios');
const io = require('socket.io-client');

// 测试向不同用户发送消息的功能
async function testMessageSendToDifferentUsers() {
    console.log('=== 测试向不同用户发送消息功能 ===\n');
    
    try {
        // 1. 登录测试用户
        console.log('1. 登录测试用户...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testimage@example.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ 登录失败:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ 登录成功, 用户ID:', user._id);
        
        // 2. 获取聊天室列表
        console.log('\n2. 获取聊天室列表...');
        const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (roomsResponse.data.success) {
            const rooms = roomsResponse.data.data;
            console.log(`✅ 获取到 ${rooms.length} 个聊天室`);
            
            if (rooms.length > 0) {
                console.log('\n聊天室列表:');
                rooms.forEach((room, index) => {
                    console.log(`${index + 1}. 聊天室ID: ${room._id}`);
                    console.log(`   任务: ${room.task?.title || '未知任务'}`);
                    console.log(`   对方用户: ${room.otherUser?.username || '未知用户'} (ID: ${room.otherUser?._id || 'undefined'})`);
                    console.log(`   最后消息: ${room.lastMessage || '无'}`);
                    console.log('');
                });
                
                // 3. 测试向每个聊天室发送消息
                console.log('3. 测试向不同用户发送消息...');
                
                for (let i = 0; i < Math.min(rooms.length, 3); i++) {
                    const room = rooms[i];
                    
                    // 验证聊天室数据完整性
                    if (!room.task || !room.otherUser || !room.task._id || !room.otherUser._id) {
                        console.log(`❌ 聊天室 ${i + 1} 数据不完整，跳过`);
                        continue;
                    }
                    
                    console.log(`\n测试向用户 ${room.otherUser.username} 发送消息...`);
                    
                    const messageData = {
                        taskId: room.task._id,
                        receiverId: room.otherUser._id,
                        content: `测试消息发送修复 - ${new Date().toLocaleTimeString()} - 发送给 ${room.otherUser.username}`,
                        messageType: 'text'
                    };
                    
                    try {
                        const sendResponse = await axios.post('http://localhost:5000/api/chat/send', messageData, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (sendResponse.data.success) {
                            console.log(`✅ 向 ${room.otherUser.username} 发送消息成功`);
                            console.log(`   消息ID: ${sendResponse.data.data._id}`);
                        } else {
                            console.log(`❌ 向 ${room.otherUser.username} 发送消息失败: ${sendResponse.data.message}`);
                        }
                    } catch (error) {
                        console.log(`❌ 向 ${room.otherUser.username} 发送消息时出错:`, error.response?.data?.message || error.message);
                    }
                    
                    // 等待一秒再发送下一条消息
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // 4. 测试Socket连接和消息发送
                console.log('\n4. 测试Socket连接和消息发送...');
                
                const socket = io('http://localhost:5000', {
                    auth: {
                        userId: user._id,
                        username: user.username
                    }
                });
                
                socket.on('connect', () => {
                    console.log('✅ Socket连接成功');
                    
                    // 认证用户
                    socket.emit('authenticate', {
                        userId: user._id,
                        username: user.username
                    });
                    
                    // 测试向第一个聊天室发送Socket消息
                    if (rooms.length > 0 && rooms[0].task && rooms[0].otherUser) {
                        const room = rooms[0];
                        const roomId = `${room.task._id}_${user._id}_${room.otherUser._id}`;
                        
                        console.log(`加入聊天室: ${roomId}`);
                        socket.emit('join_room', roomId);
                        
                        setTimeout(() => {
                            console.log('发送Socket消息...');
                            socket.emit('send_message', {
                                taskId: room.task._id,
                                receiverId: room.otherUser._id,
                                content: `Socket测试消息 - ${new Date().toLocaleTimeString()}`,
                                messageType: 'text'
                            });
                            
                            setTimeout(() => {
                                socket.disconnect();
                                console.log('✅ Socket测试完成');
                            }, 2000);
                        }, 1000);
                    }
                });
                
                socket.on('connect_error', (error) => {
                    console.log('❌ Socket连接失败:', error.message);
                });
                
                socket.on('receive_message', (data) => {
                    console.log('✅ 收到Socket消息:', data.content);
                });
                
            } else {
                console.log('❌ 没有找到聊天室，无法测试消息发送');
            }
        } else {
            console.log('❌ 获取聊天室失败:', roomsResponse.data.message);
        }
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testMessageSendToDifferentUsers();