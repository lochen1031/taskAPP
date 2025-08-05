const io = require('socket.io-client');
const axios = require('axios');

// 测试Socket连接和发送消息功能
async function testSocketAndMessage() {
    console.log('=== 测试Socket连接和发送消息 ===\n');
    
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
        
        // 2. 测试Socket连接
        console.log('\n2. 测试Socket连接...');
        const socket = io('http://localhost:5000', {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });
        
        // Socket事件监听
        socket.on('connect', () => {
            console.log('✅ Socket连接成功，Socket ID:', socket.id);
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Socket连接失败:', error.message);
        });
        
        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket断开连接:', reason);
        });
        
        socket.on('newMessage', (data) => {
            console.log('📨 收到新消息:', data);
        });
        
        socket.on('error', (error) => {
            console.log('❌ Socket错误:', error);
        });
        
        // 等待连接建立
        await new Promise(resolve => {
            socket.on('connect', resolve);
            setTimeout(() => {
                if (!socket.connected) {
                    console.log('❌ Socket连接超时');
                    resolve();
                }
            }, 5000);
        });
        
        if (!socket.connected) {
            console.log('❌ Socket未连接，无法继续测试');
            return;
        }
        
        // 3. 获取任务信息
        console.log('\n3. 获取任务信息...');
        const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const tasks = tasksResponse.data.data?.tasks || [];
        if (tasks.length === 0) {
            console.log('❌ 没有可用任务');
            return;
        }
        
        const testTask = tasks[0];
        console.log('测试任务:', testTask.title);
        
        // 4. 加入聊天室
        const receiverId = testTask.publisher._id;
        const roomId = `${testTask._id}_${userId}_${receiverId}`;
        console.log('\n4. 加入聊天室:', roomId);
        
        socket.emit('joinRoom', roomId);
        
        // 等待一下确保加入成功
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. 测试发送消息API
        console.log('\n5. 测试发送消息API...');
        const messageData = {
            taskId: testTask._id,
            receiverId: receiverId,
            content: 'Socket测试消息 - ' + new Date().toLocaleTimeString(),
            messageType: 'text'
        };
        
        try {
            const sendResponse = await axios.post('http://localhost:5000/api/chat/send', messageData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (sendResponse.data.success) {
                console.log('✅ API发送消息成功');
                
                // 6. 通过Socket发送消息
                console.log('\n6. 通过Socket发送消息...');
                socket.emit('sendMessage', {
                    ...messageData,
                    sender: { _id: userId, username: 'testuser_image' },
                    room: roomId
                });
                
                console.log('✅ Socket消息已发送');
                
            } else {
                console.log('❌ API发送消息失败:', sendResponse.data.message);
            }
        } catch (error) {
            console.log('❌ 发送消息API错误:');
            console.log('状态码:', error.response?.status);
            console.log('错误消息:', error.response?.data?.message);
        }
        
        // 7. 等待一段时间观察Socket消息
        console.log('\n7. 等待Socket消息...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 8. 测试获取聊天室列表
        console.log('\n8. 测试获取聊天室列表...');
        try {
            const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const rooms = roomsResponse.data.data || [];
            console.log('聊天室数量:', rooms.length);
            
            if (rooms.length > 0) {
                console.log('最新聊天室:', {
                    id: rooms[0]._id,
                    lastMessage: rooms[0].lastMessage,
                    task: rooms[0].task?.title
                });
            }
        } catch (error) {
            console.log('❌ 获取聊天室列表失败:', error.response?.data?.message);
        }
        
        // 关闭Socket连接
        socket.disconnect();
        console.log('\n✅ 测试完成');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
    }
}

// 运行测试
testSocketAndMessage();