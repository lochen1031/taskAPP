const axios = require('axios');

// 简单的聊天室测试
async function simpleChatroomTest() {
    console.log('=== 简单聊天室测试 ===\n');
    
    try {
        // 登录
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testimage@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('登录成功');
        
        // 获取聊天室
        const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('聊天室API响应:', roomsResponse.data);
        
    } catch (error) {
        console.log('错误:', error.message);
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('响应数据:', error.response.data);
        }
    }
}

simpleChatroomTest();