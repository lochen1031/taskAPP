// 在浏览器控制台中运行此脚本来调试前端数据

// 1. 检查React组件的状态
function debugReactState() {
  console.log('=== React组件状态调试 ===');
  
  // 尝试获取React DevTools的数据
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('找到React根组件');
  } else {
    console.log('无法访问React内部状态，请使用React DevTools');
  }
}

// 2. 检查网络请求
function debugNetworkRequests() {
  console.log('=== 网络请求调试 ===');
  console.log('请打开开发者工具的Network标签页，刷新页面并观察以下请求:');
  console.log('1. /api/chat/rooms - 获取聊天室列表');
  console.log('2. 检查响应数据中的task和otherUser字段');
  console.log('3. 确认数据结构是否正确');
}

// 3. 检查DOM元素
function debugDOMElements() {
  console.log('=== DOM元素调试 ===');
  
  // 查找聊天室列表项
  const chatItems = document.querySelectorAll('[class*="ant-list-item"]');
  console.log(`找到 ${chatItems.length} 个聊天室列表项`);
  
  chatItems.forEach((item, index) => {
    console.log(`\n聊天室 ${index + 1}:`);
    
    // 查找标题元素
    const titleElement = item.querySelector('[class*="ant-typography"]');
    if (titleElement) {
      console.log(`  显示的标题: "${titleElement.textContent}"`);
    }
    
    // 查找描述元素
    const descElements = item.querySelectorAll('[class*="ant-typography"]');
    if (descElements.length > 1) {
      console.log(`  显示的描述: "${descElements[1].textContent}"`);
    }
    
    // 检查所有文本内容
    const allText = item.textContent;
    console.log(`  所有文本内容: "${allText}"`);
  });
}

// 4. 检查localStorage和sessionStorage
function debugStorage() {
  console.log('=== 存储调试 ===');
  
  console.log('localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('chat') || key.includes('room') || key.includes('user'))) {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
    }
  }
  
  console.log('sessionStorage:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('chat') || key.includes('room') || key.includes('user'))) {
      const value = sessionStorage.getItem(key);
      console.log(`  ${key}: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
    }
  }
}

// 5. 模拟API调用
async function debugAPICall() {
  console.log('=== API调用调试 ===');
  
  try {
    // 获取token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('未找到token，请先登录');
      return;
    }
    
    console.log('发送聊天室API请求...');
    const response = await fetch('/api/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('API响应:', data);
    
    if (data.success && data.data) {
      console.log(`\n获取到 ${data.data.length} 个聊天室:`);
      data.data.forEach((room, index) => {
        console.log(`\n聊天室 ${index + 1}:`);
        console.log(`  task.title: "${room.task?.title}"`);
        console.log(`  otherUser.username: "${room.otherUser?.username}"`);
        
        if (room.task?.title === room.otherUser?.username) {
          console.log(`  ❌ 数据异常: task.title 等于 otherUser.username`);
        } else {
          console.log(`  ✅ 数据正常`);
        }
      });
    }
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

// 6. 主调试函数
function debugAll() {
  console.clear();
  console.log('🔍 开始前端数据调试...');
  
  debugReactState();
  debugNetworkRequests();
  debugDOMElements();
  debugStorage();
  debugAPICall();
  
  console.log('\n📋 调试完成！请检查上述输出结果。');
  console.log('\n💡 建议操作:');
  console.log('1. 如果DOM显示的标题是任务名称，说明前端渲染逻辑有问题');
  console.log('2. 如果API返回的数据中task.title等于otherUser.username，说明后端数据有问题');
  console.log('3. 检查Network标签页中的实际API响应');
  console.log('4. 清除浏览器缓存并刷新页面');
}

// 导出函数供浏览器控制台使用
if (typeof window !== 'undefined') {
  window.debugFrontendData = {
    debugAll,
    debugReactState,
    debugNetworkRequests,
    debugDOMElements,
    debugStorage,
    debugAPICall
  };
  
  console.log('🚀 前端调试工具已加载！');
  console.log('在浏览器控制台中运行: debugFrontendData.debugAll()');
}

// 如果在Node.js环境中运行，显示使用说明
if (typeof window === 'undefined') {
  console.log('=== 前端调试脚本使用说明 ===');
  console.log('1. 打开浏览器，访问 http://localhost:3000/chat');
  console.log('2. 打开开发者工具 (F12)');
  console.log('3. 在控制台中粘贴此脚本的内容');
  console.log('4. 运行 debugFrontendData.debugAll()');
  console.log('5. 检查输出结果以找出问题所在');
}