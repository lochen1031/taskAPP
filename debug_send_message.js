const axios = require('axios');

// 调试发送消息失败的问题
async function debugSendMessage() {
    console.log('=== 调试发送消息失败问题 ===\n');
    
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
        
        // 2. 获取用户信息
        console.log('\n2. 获取用户信息...');
        const userResponse = await axios.get('http://localhost:5000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('用户API响应:', userResponse.data);
        const currentUser = userResponse.data.data?.user || userResponse.data.user || userResponse.data.data || userResponse.data;
        console.log('用户名:', currentUser?.username || '未知');
        
        // 3. 获取任务列表
        console.log('\n3. 获取任务列表...');
        const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('任务API响应:', tasksResponse.data);
        const tasks = tasksResponse.data.data?.tasks || tasksResponse.data.tasks || tasksResponse.data.data || [];
        console.log('任务数量:', tasks.length);
        
        if (tasks.length === 0) {
            console.log('❌ 没有可用的任务，无法测试发送消息');
            console.log('建议：先创建一个任务或申请一个任务');
            return;
        }
        
        // 4. 选择一个任务进行测试
        const testTask = tasks[0];
        console.log('\n4. 测试任务信息:');
        console.log('- 任务ID:', testTask._id);
        console.log('- 任务标题:', testTask.title);
        console.log('- 任务状态:', testTask.status);
        console.log('- 发布者ID:', testTask.publisher._id);
        console.log('- 接受者ID:', testTask.assignee?._id || '无');
        console.log('- 申请者数量:', testTask.applicants?.length || 0);
        
        // 5. 检查用户与任务的关系
        console.log('\n5. 检查用户权限:');
        const isPublisher = testTask.publisher._id === userId;
        const isAssignee = testTask.assignee?._id === userId;
        const isApplicant = testTask.applicants?.some(app => app.user === userId);
        
        console.log('- 是发布者:', isPublisher);
        console.log('- 是接受者:', isAssignee);
        console.log('- 是申请者:', isApplicant);
        
        // 6. 确定接收者
        let receiverId;
        if (isPublisher && testTask.assignee) {
            receiverId = testTask.assignee._id;
            console.log('\n6. 作为发布者，向接受者发送消息');
        } else if (isAssignee) {
            receiverId = testTask.publisher._id;
            console.log('\n6. 作为接受者，向发布者发送消息');
        } else if (isApplicant) {
            receiverId = testTask.publisher._id;
            console.log('\n6. 作为申请者，向发布者发送消息');
        } else {
            console.log('\n❌ 用户与此任务无关，无法发送消息');
            
            // 尝试申请任务
            if (testTask.status === '待接取' && !isPublisher) {
                console.log('\n尝试申请任务...');
                try {
                    const applyResponse = await axios.post(`http://localhost:5000/api/tasks/${testTask._id}/apply`, {
                        message: '测试申请消息'
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (applyResponse.data.success) {
                        console.log('✅ 申请成功，现在可以发送消息了');
                        receiverId = testTask.publisher._id;
                    } else {
                        console.log('❌ 申请失败:', applyResponse.data.message);
                        return;
                    }
                } catch (error) {
                    console.log('❌ 申请任务失败:', error.response?.data?.message || error.message);
                    return;
                }
            } else {
                console.log('无法申请此任务（可能已被接取或您是发布者）');
                return;
            }
        }
        
        console.log('接收者ID:', receiverId);
        
        // 7. 测试发送消息
        console.log('\n7. 测试发送消息...');
        const messageData = {
            taskId: testTask._id,
            receiverId: receiverId,
            content: '这是一条测试消息 - ' + new Date().toLocaleTimeString(),
            messageType: 'text'
        };
        
        try {
            const sendResponse = await axios.post('http://localhost:5000/api/chat/send', messageData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (sendResponse.data.success) {
                console.log('✅ 消息发送成功！');
                console.log('消息内容:', sendResponse.data.data.content);
                console.log('消息ID:', sendResponse.data.data._id);
            } else {
                console.log('❌ 消息发送失败:', sendResponse.data.message);
            }
        } catch (error) {
            console.log('❌ 发送消息API错误:');
            console.log('状态码:', error.response?.status);
            console.log('错误消息:', error.response?.data?.message);
            console.log('详细错误:', error.response?.data?.error);
            
            // 分析常见错误原因
            if (error.response?.status === 403) {
                console.log('\n🔍 权限错误分析:');
                console.log('- 检查用户是否是任务参与者');
                console.log('- 检查接收者是否是任务参与者');
                console.log('- 确认任务状态是否允许发送消息');
            } else if (error.response?.status === 404) {
                console.log('\n🔍 资源不存在错误:');
                console.log('- 检查任务ID是否有效');
                console.log('- 检查接收者ID是否有效');
            } else if (error.response?.status === 400) {
                console.log('\n🔍 参数错误:');
                console.log('- 检查必要参数是否完整');
                console.log('- 检查参数格式是否正确');
            }
        }
        
        // 8. 获取聊天室列表验证
        console.log('\n8. 验证聊天室列表...');
        try {
            const roomsResponse = await axios.get('http://localhost:5000/api/chat/rooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('聊天室数量:', roomsResponse.data.data?.length || 0);
        } catch (error) {
            console.log('获取聊天室列表失败:', error.response?.data?.message);
        }
        
    } catch (error) {
        console.error('调试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

debugSendMessage();