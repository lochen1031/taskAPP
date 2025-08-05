// 调试聊天按钮问题的脚本
// 在浏览器控制台中运行此脚本

const debugChatButtonIssue = async () => {
  console.log('=== 聊天按钮问题调试 ===');
  
  // 1. 检查当前页面
  console.log('\n1. 当前页面信息:');
  console.log('URL:', window.location.href);
  console.log('路径:', window.location.pathname);
  console.log('参数:', window.location.search);
  
  // 2. 检查是否在任务详情页
  if (window.location.pathname.includes('/tasks/')) {
    console.log('\n2. 任务详情页检查:');
    
    // 查找聊天按钮
    const chatButtons = document.querySelectorAll('a[href*="/chat"]');
    console.log('找到聊天按钮数量:', chatButtons.length);
    
    chatButtons.forEach((button, index) => {
      console.log(`聊天按钮 ${index + 1}:`, {
        href: button.href,
        text: button.textContent.trim(),
        visible: button.offsetParent !== null,
        disabled: button.disabled || button.getAttribute('disabled')
      });
    });
    
    // 3. 检查申请者列表
    console.log('\n3. 申请者列表检查:');
    const applicantItems = document.querySelectorAll('.ant-list-item');
    console.log('申请者项目数量:', applicantItems.length);
    
    applicantItems.forEach((item, index) => {
      const chatLink = item.querySelector('a[href*="/chat"]');
      if (chatLink) {
        console.log(`申请者 ${index + 1} 聊天链接:`, {
          href: chatLink.href,
          text: chatLink.textContent.trim()
        });
        
        // 解析URL参数
        try {
          const url = new URL(chatLink.href);
          const taskId = url.searchParams.get('task');
          const userId = url.searchParams.get('user');
          
          console.log(`  - taskId: ${taskId} (长度: ${taskId?.length})`);
          console.log(`  - userId: ${userId} (长度: ${userId?.length})`);
          
          // 验证ID格式
          const isValidTaskId = taskId && taskId.length === 24;
          const isValidUserId = userId && userId.length === 24;
          
          console.log(`  - taskId有效: ${isValidTaskId}`);
          console.log(`  - userId有效: ${isValidUserId}`);
          
          if (!isValidTaskId || !isValidUserId) {
            console.warn('  ⚠️ 发现无效的ID参数!');
          }
        } catch (error) {
          console.error('  ❌ URL解析失败:', error);
        }
      }
    });
  }
  
  // 4. 检查是否在聊天页面
  if (window.location.pathname === '/chat') {
    console.log('\n4. 聊天页面检查:');
    
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('task');
    const userId = urlParams.get('user');
    
    console.log('URL参数:');
    console.log('- task:', taskId);
    console.log('- user:', userId);
    
    if (taskId && userId) {
      console.log('参数验证:');
      console.log('- taskId长度:', taskId.length, '(应为24)');
      console.log('- userId长度:', userId.length, '(应为24)');
      console.log('- taskId有效:', taskId.length === 24);
      console.log('- userId有效:', userId.length === 24);
    }
    
    // 检查React组件状态
    console.log('\n5. React组件状态检查:');
    
    // 查找聊天室列表
    const chatRoomList = document.querySelector('.ant-list');
    if (chatRoomList) {
      const chatRoomItems = chatRoomList.querySelectorAll('.ant-list-item');
      console.log('聊天室数量:', chatRoomItems.length);
    }
    
    // 查找当前聊天区域
    const chatArea = document.querySelector('.ant-layout-content');
    if (chatArea) {
      const hasMessages = chatArea.querySelector('.ant-empty') === null;
      console.log('是否有消息区域:', hasMessages);
    }
    
    // 检查控制台错误
    console.log('\n6. 检查控制台错误:');
    console.log('请查看控制台是否有红色错误信息，特别是:');
    console.log('- "聊天室数据不完整"');
    console.log('- "无效的聊天室参数"');
    console.log('- "任务不存在"');
    console.log('- "用户不存在"');
  }
  
  // 7. 测试API可用性
  console.log('\n7. API可用性测试:');
  
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ 找到认证token');
    
    // 测试聊天室API
    try {
      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 聊天室API正常');
        console.log('聊天室数量:', data.data?.length || 0);
      } else {
        console.log('❌ 聊天室API失败:', response.status);
      }
    } catch (error) {
      console.log('❌ 聊天室API错误:', error.message);
    }
  } else {
    console.log('❌ 未找到认证token，请先登录');
  }
  
  // 8. 提供解决建议
  console.log('\n8. 问题排查建议:');
  console.log('如果聊天按钮点击后无法聊天，请检查:');
  console.log('1. 浏览器控制台是否有错误信息');
  console.log('2. URL参数是否正确（task和user参数长度应为24）');
  console.log('3. 是否已登录（检查localStorage中的token）');
  console.log('4. 网络连接是否正常');
  console.log('5. 尝试硬刷新页面（Ctrl+F5）');
  console.log('6. 清除浏览器缓存和localStorage');
  
  return {
    currentPage: window.location.pathname,
    hasToken: !!localStorage.getItem('token'),
    chatButtonsFound: document.querySelectorAll('a[href*="/chat"]').length
  };
};

// 自动运行调试
if (typeof window !== 'undefined') {
  debugChatButtonIssue();
}

// 导出函数供手动调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debugChatButtonIssue;
}