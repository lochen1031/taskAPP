# Vercel 部署指南

## 准备工作

### 1. 注册 MongoDB Atlas（云数据库）
1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 注册免费账户
3. 创建新的集群（选择免费的 M0 Sandbox）
4. 等待集群创建完成（约2-3分钟）
5. 点击 "Connect" 按钮
6. 选择 "Connect your application"
7. 复制连接字符串，格式类似：
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus_tasks?retryWrites=true&w=majority
   ```

### 2. 配置网络访问
1. 在 MongoDB Atlas 中，点击左侧菜单的 "Network Access"
2. 点击 "Add IP Address"
3. 选择 "Allow access from anywhere" (0.0.0.0/0)
4. 点击 "Confirm"

## Vercel 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

#### 1. 准备 Git 仓库
```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit for Vercel deployment"

# 推送到 GitHub（需要先在 GitHub 创建仓库）
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

#### 2. 在 Vercel 部署
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择你的 GitHub 仓库
5. 点击 "Import"
6. Vercel 会自动检测到这是一个 Node.js 项目

#### 3. 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

1. 点击项目的 "Settings" 标签
2. 选择 "Environment Variables"
3. 添加以下变量：

```
MONGODB_URI = mongodb+srv://你的用户名:你的密码@cluster0.xxxxx.mongodb.net/campus_tasks?retryWrites=true&w=majority
JWT_SECRET = 你的JWT密钥（建议使用强密码生成器生成）
CLIENT_URL = https://你的vercel域名.vercel.app
```

#### 4. 重新部署
1. 点击 "Deployments" 标签
2. 点击最新部署右侧的三个点
3. 选择 "Redeploy"

### 方法二：通过 Vercel CLI 部署

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署项目
```bash
# 在项目根目录运行
vercel

# 按照提示操作：
# - Set up and deploy? [Y/n] y
# - Which scope? 选择你的账户
# - Link to existing project? [y/N] n
# - What's your project's name? 输入项目名称
# - In which directory is your code located? ./
```

#### 4. 设置环境变量
```bash
vercel env add MONGODB_URI
# 输入你的 MongoDB 连接字符串

vercel env add JWT_SECRET
# 输入你的 JWT 密钥

vercel env add CLIENT_URL
# 输入你的 Vercel 域名
```

#### 5. 重新部署
```bash
vercel --prod
```

## 部署后验证

1. 访问你的 Vercel 域名
2. 测试用户注册和登录功能
3. 测试任务发布和聊天功能
4. 检查浏览器控制台是否有错误

## 常见问题解决

### 1. 数据库连接失败
- 检查 MongoDB Atlas 的网络访问设置
- 确认连接字符串中的用户名和密码正确
- 确认数据库名称正确

### 2. Socket.IO 连接问题
- 确认 CLIENT_URL 环境变量设置正确
- 检查 CORS 配置

### 3. 静态文件访问问题
- 确认 vercel.json 配置正确
- 检查路由配置

### 4. 构建失败
- 检查 package.json 中的依赖
- 确认 vercel-build 脚本正确

## 更新部署

每次代码更新后，只需要推送到 GitHub：
```bash
git add .
git commit -m "更新描述"
git push
```

Vercel 会自动检测到更改并重新部署。

## 自定义域名（可选）

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

## 监控和日志

1. 在 Vercel 控制台查看部署日志
2. 使用 "Functions" 标签查看服务器日志
3. 设置错误监控和性能监控

---

部署完成后，你的应用就可以通过 Vercel 提供的域名访问了！