// 调试联系按钮问题的脚本

// 在浏览器控制台中运行此脚本来调试联系按钮问题
function debugContactButton() {
  console.log('=== 联系按钮调试 ===');
  
  // 1. 检查页面上的联系按钮
  const contactButtons = document.querySelectorAll('a[href*="/chat"]');
  console.log('找到联系按钮数量:', contactButtons.length);
  
  contactButtons.forEach((button, index) => {
    console.log(`\n按钮 ${index + 1}:`);
    console.log('- href:', button.href);
    console.log('- 按钮文本:', button.textContent.trim());
    console.log('- 父元素:', button.parentElement.tagName);
  });
  
  // 2. 检查React组件的数据
  console.log('\n=== 检查React数据 ===');
  
  // 尝试从React DevTools获取数据
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('React应用已加载');
  } else {
    console.log('无法访问React内部数据');
  }
  
  // 3. 检查网络请求
  console.log('\n=== 网络请求检查 ===');
  console.log('请在Network标签页中查看以下请求:');
  console.log('- /api/tasks/my/applied');
  console.log('- /api/tasks/my/assigned');
  console.log('- /api/tasks/my/published');
  
  // 4. 检查localStorage中的用户信息
  const token = localStorage.getItem('token');
  if (token) {
    console.log('\n用户已登录，token存在');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('用户ID:', payload.userId);
    } catch (e) {
      console.log('无法解析token');
    }
  } else {
    console.log('\n用户未登录');
  }
  
  // 5. 模拟API调用测试
  async function testAPI() {
    console.log('\n=== API测试 ===');
    
    if (!token) {
      console.log('❌ 无token，跳过API测试');
      return;
    }
    
    try {
      // 测试获取我申请的任务
      console.log('测试获取我申请的任务...');
      const response = await fetch('/api/tasks/my/applied', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API调用成功');
        console.log('任务数量:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
          const firstTask = data.data[0];
          console.log('\n第一个任务数据结构:');
          console.log('- 任务ID:', firstTask._id);
          console.log('- 任务标题:', firstTask.title);
          console.log('- 发布者信息:', firstTask.publisher);
          
          if (firstTask.publisher) {
            console.log('  - 发布者ID:', firstTask.publisher._id);
            console.log('  - 发布者用户名:', firstTask.publisher.username);
          } else {
            console.log('  ❌ 发布者信息缺失!');
          }
        }
      } else {
        console.log('❌ API调用失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ API调用错误:', error.message);
    }
  }
  
  // 执行API测试
  testAPI();
  
  // 6. 检查URL参数解析
  console.log('\n=== URL参数检查 ===');
  const currentUrl = window.location.href;
  console.log('当前URL:', currentUrl);
  
  if (currentUrl.includes('/chat')) {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL参数:');
    console.log('- task:', urlParams.get('task'));
    console.log('- user:', urlParams.get('user'));
  }
  
  return {
    contactButtonsFound: contactButtons.length,
    hasToken: !!token,
    currentPage: window.location.pathname
  };
}

// 自动运行调试
if (typeof window !== 'undefined') {
  console.log('联系按钮调试脚本已加载');
  console.log('运行 debugContactButton() 开始调试');
  
  // 如果页面已加载完成，自动运行
  if (document.readyState === 'complete') {
    setTimeout(debugContactButton, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(debugContactButton, 1000);
    });
  }
}

// 导出函数供手动调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugContactButton };
}