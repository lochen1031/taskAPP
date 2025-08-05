// 測試前端空消息發送的腳本
// 在瀏覽器控制台中運行

function testEmptyMessageSending() {
  console.log('=== 測試前端空消息發送 ===');
  
  // 1. 檢查當前頁面狀態
  console.log('\n1. 檢查當前頁面:');
  console.log('- URL:', window.location.href);
  console.log('- 是否在聊天頁面:', window.location.pathname.includes('/chat'));
  
  // 2. 檢查輸入框和按鈕
  console.log('\n2. 檢查UI元素:');
  const messageInput = document.querySelector('textarea[placeholder*="輸入消息"]');
  const sendButton = document.querySelector('button[type="primary"]');
  
  if (!messageInput) {
    console.log('❌ 未找到消息輸入框');
    return;
  }
  
  if (!sendButton) {
    console.log('❌ 未找到發送按鈕');
    return;
  }
  
  console.log('✅ 找到輸入框和發送按鈕');
  console.log('- 輸入框當前值:', `"${messageInput.value}"`);
  console.log('- 發送按鈕是否禁用:', sendButton.disabled);
  
  // 3. 測試空消息情況
  console.log('\n3. 測試空消息情況:');
  
  // 保存原始值
  const originalValue = messageInput.value;
  
  // 測試案例
  const testCases = [
    { name: '完全空白', value: '' },
    { name: '只有空格', value: '   ' },
    { name: '只有換行', value: '\n\n' },
    { name: '空格和換行', value: '  \n  \n  ' },
    { name: '只有tab', value: '\t\t' }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n測試案例 ${index + 1}: ${testCase.name}`);
    
    // 設置輸入框值
    messageInput.value = testCase.value;
    
    // 觸發input事件來更新React狀態
    const inputEvent = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(inputEvent);
    
    // 等待一下讓React更新
    setTimeout(() => {
      console.log(`- 輸入框值: "${messageInput.value}"`);
      console.log(`- 發送按鈕禁用狀態: ${sendButton.disabled}`);
      
      // 嘗試點擊發送按鈕
      if (!sendButton.disabled) {
        console.log('⚠️ 警告: 發送按鈕未被禁用，可能會發送空消息!');
        
        // 模擬點擊但不實際發送
        console.log('模擬點擊發送按鈕...');
        // sendButton.click(); // 註釋掉實際點擊
      } else {
        console.log('✅ 發送按鈕正確禁用');
      }
    }, 100);
  });
  
  // 4. 恢復原始值
  setTimeout(() => {
    messageInput.value = originalValue;
    const inputEvent = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(inputEvent);
    console.log('\n✅ 已恢復原始輸入框值');
  }, 1000);
  
  // 5. 檢查網絡請求監控
  console.log('\n4. 設置網絡請求監控:');
  
  // 監控fetch請求
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    if (url.includes('/chat/send')) {
      console.log('🚨 檢測到發送消息請求:');
      console.log('- URL:', url);
      console.log('- 請求體:', options?.body);
      
      try {
        const body = JSON.parse(options?.body || '{}');
        if (!body.content || !body.content.trim()) {
          console.log('❌ 警告: 檢測到空消息發送請求!');
          console.log('- content值:', `"${body.content}"`);
        }
      } catch (e) {
        console.log('無法解析請求體');
      }
    }
    return originalFetch.apply(this, args);
  };
  
  // 監控axios請求
  if (window.axios && window.axios.interceptors) {
    window.axios.interceptors.request.use(config => {
      if (config.url && config.url.includes('/chat/send')) {
        console.log('🚨 檢測到axios發送消息請求:');
        console.log('- URL:', config.url);
        console.log('- 請求數據:', config.data);
        
        if (!config.data?.content || !config.data.content.trim()) {
          console.log('❌ 警告: 檢測到空消息發送請求!');
          console.log('- content值:', `"${config.data?.content}"`);
        }
      }
      return config;
    });
  }
  
  console.log('✅ 網絡請求監控已設置');
  console.log('\n現在可以嘗試發送消息，監控器會檢測空消息請求');
}

// 自動運行
if (typeof window !== 'undefined' && window.location.pathname.includes('/chat')) {
  console.log('前端空消息測試腳本已加載');
  console.log('運行 testEmptyMessageSending() 開始測試');
  
  // 延迟运行以确保页面加载完成
  setTimeout(() => {
    testEmptyMessageSending();
  }, 1000);
} else {
  console.log('請在聊天頁面運行此腳本');
}