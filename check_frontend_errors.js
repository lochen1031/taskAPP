const puppeteer = require('puppeteer');

// 检查前端的具体错误
async function checkFrontendErrors() {
    console.log('=== 检查前端发送消息错误 ===\n');
    
    let browser;
    try {
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // 监听控制台消息
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error' || text.includes('失败') || text.includes('错误')) {
                console.log(`🔴 [${type.toUpperCase()}] ${text}`);
            } else if (type === 'warn') {
                console.log(`🟡 [${type.toUpperCase()}] ${text}`);
            } else {
                console.log(`ℹ️  [${type.toUpperCase()}] ${text}`);
            }
        });
        
        // 监听网络请求
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            
            if (url.includes('/api/') && status >= 400) {
                console.log(`🔴 API错误: ${status} ${url}`);
            } else if (url.includes('/api/chat/send')) {
                console.log(`📤 发送消息API: ${status} ${url}`);
            }
        });
        
        // 访问聊天页面
        console.log('1. 访问聊天页面...');
        await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2' });
        
        // 等待页面加载
        await page.waitForTimeout(3000);
        
        console.log('\n2. 页面已加载，请在浏览器中尝试发送消息...');
        console.log('观察控制台输出以查看具体错误信息');
        
        // 保持浏览器打开一段时间供用户测试
        await page.waitForTimeout(60000); // 等待1分钟
        
    } catch (error) {
        console.error('检查前端错误时发生异常:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 如果没有puppeteer，提供手动检查指南
function manualCheckGuide() {
    console.log('=== 手动检查前端错误指南 ===\n');
    console.log('由于可能没有安装puppeteer，请手动执行以下步骤：\n');
    console.log('1. 打开浏览器访问: http://localhost:3000/chat');
    console.log('2. 按F12打开开发者工具');
    console.log('3. 切换到Console标签页');
    console.log('4. 尝试发送一条消息');
    console.log('5. 观察控制台中的错误信息\n');
    console.log('常见错误类型：');
    console.log('- Socket连接错误');
    console.log('- API请求失败');
    console.log('- 权限验证失败');
    console.log('- 参数格式错误\n');
    console.log('请将看到的错误信息告诉我，以便进一步诊断。');
}

// 尝试运行puppeteer检查，如果失败则显示手动指南
try {
    checkFrontendErrors();
} catch (error) {
    console.log('无法启动自动检查，使用手动检查方式：\n');
    manualCheckGuide();
}