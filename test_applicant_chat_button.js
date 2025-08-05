const axios = require('axios');

// 测试申请者聊天按钮功能
async function testApplicantChatButton() {
  try {
    console.log('开始测试申请者聊天按钮功能...');
    
    // 1. 登录获取token
    console.log('\n1. 登录测试用户...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testimage@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.token;
    console.log('登录成功');
    
    // 2. 获取任务列表，找到有申请者的任务
    console.log('\n2. 获取任务列表...');
    const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!tasksResponse.data.success || !tasksResponse.data.data.tasks.length) {
      throw new Error('没有找到任务');
    }
    
    // 3. 查找有申请者的任务
    let taskWithApplicants = null;
    for (const task of tasksResponse.data.data.tasks) {
      const taskDetailResponse = await axios.get(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (taskDetailResponse.data.success && 
          taskDetailResponse.data.data.applicants && 
          taskDetailResponse.data.data.applicants.length > 0) {
        taskWithApplicants = taskDetailResponse.data.data;
        break;
      }
    }
    
    if (!taskWithApplicants) {
      console.log('没有找到有申请者的任务，创建一个测试场景...');
      
      // 创建一个新任务
      const createTaskResponse = await axios.post('http://localhost:5000/api/tasks', {
        title: '测试申请者聊天按钮任务',
        description: '这是一个用于测试申请者聊天按钮的任务',
        reward: 50,
        location: '测试地点',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '1小时',
        difficulty: 'easy',
        category: '其他'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!createTaskResponse.data.success) {
        throw new Error('创建测试任务失败');
      }
      
      const newTaskId = createTaskResponse.data.data._id;
      console.log(`创建了测试任务: ${newTaskId}`);
      
      // 用另一个用户申请这个任务
      const applicantLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'testuser0@example.com',
        password: 'password123'
      });
      
      if (applicantLoginResponse.data.success) {
        const applicantToken = applicantLoginResponse.data.token;
        
        const applyResponse = await axios.post(`http://localhost:5000/api/tasks/${newTaskId}/apply`, {
          message: '我想申请这个任务'
        }, {
          headers: { Authorization: `Bearer ${applicantToken}` }
        });
        
        if (applyResponse.data.success) {
          console.log('申请任务成功');
          
          // 重新获取任务详情
          const updatedTaskResponse = await axios.get(`http://localhost:5000/api/tasks/${newTaskId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (updatedTaskResponse.data.success) {
            taskWithApplicants = updatedTaskResponse.data.data;
          }
        }
      }
    }
    
    if (!taskWithApplicants) {
      throw new Error('无法创建或找到有申请者的任务');
    }
    
    console.log(`\n3. 找到任务: ${taskWithApplicants.title}`);
    console.log(`申请者数量: ${taskWithApplicants.applicants.length}`);
    
    // 4. 检查申请者数据结构
    console.log('\n4. 检查申请者数据结构...');
    taskWithApplicants.applicants.forEach((applicant, index) => {
      console.log(`申请者 ${index + 1}:`);
      console.log(`  - user存在: ${!!applicant.user}`);
      if (applicant.user) {
        console.log(`  - user._id: ${applicant.user._id}`);
        console.log(`  - username: ${applicant.user.username}`);
      }
      console.log(`  - message: ${applicant.message}`);
    });
    
    // 5. 测试聊天室访问权限
    console.log('\n5. 测试聊天室访问权限...');
    const firstApplicant = taskWithApplicants.applicants[0];
    
    if (firstApplicant && firstApplicant.user && firstApplicant.user._id) {
      const chatRoomUrl = `/chat?task=${taskWithApplicants._id}&user=${firstApplicant.user._id}`;
      console.log(`聊天室URL: ${chatRoomUrl}`);
      
      // 测试获取聊天室消息
      try {
        const messagesResponse = await axios.get(
          `http://localhost:5000/api/chat/room/${taskWithApplicants._id}/${firstApplicant.user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (messagesResponse.data.success) {
          console.log('✅ 聊天室访问权限正常');
          console.log(`消息数量: ${messagesResponse.data.data.length}`);
        } else {
          console.log('❌ 聊天室访问失败:', messagesResponse.data.message);
        }
      } catch (error) {
        console.log('❌ 聊天室访问出错:', error.response?.data?.message || error.message);
      }
      
      // 6. 测试发送消息到聊天室
      console.log('\n6. 测试发送消息到聊天室...');
      try {
        const sendMessageResponse = await axios.post('http://localhost:5000/api/chat/send', {
          taskId: taskWithApplicants._id,
          receiverId: firstApplicant.user._id,
          content: '测试申请者聊天按钮消息发送'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (sendMessageResponse.data.success) {
          console.log('✅ 消息发送成功');
        } else {
          console.log('❌ 消息发送失败:', sendMessageResponse.data.message);
        }
      } catch (error) {
        console.log('❌ 消息发送出错:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('❌ 申请者数据不完整，无法测试聊天功能');
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testApplicantChatButton();