const axios = require('axios');

// 测试修复后的聊天室API
async function testFixedChatrooms() {
    console.log('=== 测试修复后的聊天室API ===\n');
    
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
        
        // 2. 测试获取聊天室列表
        console.log('\n2. 测试获取聊天室列表...');
        const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (roomsResponse.data.success) {
            const rooms = roomsResponse.data.data || [];
            console.log('✅ 聊天室API调用成功');
            console.log('聊天室数量:', rooms.length);
            
            if (rooms.length > 0) {
                console.log('\n聊天室列表:');
                rooms.forEach((room, index) => {
                    console.log(`${index + 1}. 聊天室ID: ${room._id}`);
                    console.log(`   最后消息: ${room.lastMessage}`);
                    console.log(`   最后消息时间: ${new Date(room.lastMessageTime).toLocaleString()}`);
                    console.log(`   任务: ${room.task?.title || '未知任务'}`);
                    console.log(`   对方用户: ${room.otherUser?.username || '未知用户'}`);
                    console.log(`   未读数量: ${room.unreadCount}`);
                    console.log('');
                });
            } else {
                console.log('❌ 没有找到聊天室');
            }
        } else {
            console.log('❌ 聊天室API调用失败:', roomsResponse.data.message);
        }
        
        // 3. 测试发送一条新消息
        console.log('3. 测试发送新消息...');
        const messageData = {
            taskId: '6884ea7763dd54c79507b817',
            receiverId: '68849dd76352d088b73e9bd8',
            content: '测试修复后的消息发送 - ' + new Date().toLocaleTimeString(),
            messageType: 'text'
        };
        
        try {
            const sendResponse = await axios.post('http://localhost:5000/api/chat/send', messageData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (sendResponse.data.success) {
                console.log('✅ 消息发送成功');
                console.log('消息ID:', sendResponse.data.data._id);
                
                // 4. 再次获取聊天室列表，验证更新
                console.log('\n4. 验证聊天室列表更新...');
                const updatedRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (updatedRoomsResponse.data.success) {
                    const updatedRooms = updatedRoomsResponse.data.data || [];
                    console.log('✅ 更新后聊天室数量:', updatedRooms.length);
                    
                    if (updatedRooms.length > 0) {
                        const latestRoom = updatedRooms[0];
                        console.log('最新聊天室:');
                        console.log('- 最后消息:', latestRoom.lastMessage);
                        console.log('- 最后消息时间:', new Date(latestRoom.lastMessageTime).toLocaleString());
                    }
                } else {
                    console.log('❌ 获取更新后聊天室失败');
                }
                
            } else {
                console.log('❌ 消息发送失败:', sendResponse.data.message);
            }
        } catch (error) {
            console.log('❌ 发送消息时出错:');
            console.log('状态码:', error.response?.status);
            console.log('错误消息:', error.response?.data?.message);
        }
        
        console.log('\n✅ 测试完成');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testFixedChatrooms();