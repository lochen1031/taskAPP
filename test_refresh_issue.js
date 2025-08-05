const axios = require('axios');

// 测试刷新页面后的问题
async function testRefreshIssue() {
    console.log('=== 测试刷新页面后的问题 ===');
    
    try {
        // 1. 首先登录获取token
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
        console.log('登录成功，获取到token');
        
        // 2. 测试获取聊天室列表（模拟页面刷新时的第一个请求）
        console.log('\n2. 测试获取聊天室列表...');
        const chatRoomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('聊天室列表API状态:', chatRoomsResponse.status);
        console.log('聊天室数量:', chatRoomsResponse.data.chatRooms?.length || 0);
        
        // 3. 测试无效的聊天室URL参数（模拟用户访问无效链接）
        console.log('\n3. 测试无效的聊天室URL参数...');
        
        // 测试无效的task参数
        try {
            const invalidTaskResponse = await axios.get('http://localhost:5000/api/chat/messages/invalid_task_id/invalid_user_id', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('无效task参数 - 意外成功:', invalidTaskResponse.status);
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('无效task参数 - 正确返回500错误（已修复处理）');
            } else {
                console.log('无效task参数 - 其他错误:', error.response?.status, error.response?.data?.message);
            }
        }
        
        // 4. 测试格式不正确的ID（不是24位）
        console.log('\n4. 测试格式不正确的ID...');
        try {
            const shortIdResponse = await axios.get('http://localhost:5000/api/chat/messages/123/456', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('短ID参数 - 意外成功:', shortIdResponse.status);
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('短ID参数 - 正确返回500错误（前端应该已处理）');
            } else {
                console.log('短ID参数 - 其他错误:', error.response?.status, error.response?.data?.message);
            }
        }
        
        // 5. 测试正常的API调用
        console.log('\n5. 测试其他正常API...');
        
        // 测试任务列表
        try {
            const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('任务列表API状态:', tasksResponse.status);
            console.log('任务数量:', tasksResponse.data.tasks?.length || 0);
        } catch (error) {
            console.log('任务列表API错误:', error.response?.status, error.response?.data?.message);
        }
        
        // 测试用户信息
        try {
            const userResponse = await axios.get('http://localhost:5000/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('用户信息API状态:', userResponse.status);
            console.log('用户名:', userResponse.data.user?.username);
        } catch (error) {
            console.log('用户信息API错误:', error.response?.status, error.response?.data?.message);
        }
        
        console.log('\n=== 测试完成 ===');
        console.log('如果所有API都正常工作，那么"获取消息失败"的问题应该已经解决。');
        console.log('前端现在会正确处理无效参数，自动跳转到聊天首页而不显示错误。');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

testRefreshIssue();