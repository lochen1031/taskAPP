# 校園任務平台

一個專為大學生設計的任務發布與接收平台，支持跑腿任務、校園交通、互動陪伴、空間整理等多種任務類型，並提供實時聊天功能。

## 功能特性

### 核心功能
- **任務發布與管理**：用戶可以發布各種類型的任務，設置報酬、截止時間等
- **任務申請與接取**：其他用戶可以申請任務，發布者可以選擇合適的申請者
- **實時聊天系統**：基於Socket.IO的實時聊天，方便雙方溝通需求
- **用戶認證系統**：安全的註冊登錄，JWT令牌認證
- **個人資料管理**：完善的用戶信息管理和統計

### 任務類型
- 🏃‍♂️ **跑腿任務**：代購、取快遞、送文件等
- 🚗 **校園交通**：拼車、代駕等交通服務
- 👥 **互動陪伴**：學習陪伴、運動夥伴等
- 🏠 **空間整理**：宿舍清潔、物品整理等
- 📚 **學習輔導**：課業輔導、技能分享等
- 🎯 **其他服務**：各種校園生活服務

### 技術特性
- **響應式設計**：支持桌面端和移動端
- **實時通信**：WebSocket實時消息推送
- **文件上傳**：支持任務圖片上傳
- **搜索過濾**：強大的任務搜索和篩選功能
- **數據統計**：用戶任務統計和成就系統

## 技術棧

### 後端
- **Node.js** + **Express.js** - 服務器框架
- **MongoDB** + **Mongoose** - 數據庫
- **Socket.IO** - 實時通信
- **JWT** - 身份認證
- **bcryptjs** - 密碼加密
- **Multer** - 文件上傳

### 前端
- **React 18** - 前端框架
- **Ant Design** - UI組件庫
- **React Router** - 路由管理
- **Axios** - HTTP客戶端
- **Socket.IO Client** - 實時通信客戶端
- **Moment.js** - 時間處理

## 項目結構

```
campus-task-platform/
├── server.js                 # 後端入口文件
├── package.json             # 後端依賴配置
├── .env                     # 環境變量配置
├── models/                  # 數據模型
│   ├── User.js             # 用戶模型
│   ├── Task.js             # 任務模型
│   └── Message.js          # 消息模型
├── routes/                  # API路由
│   ├── auth.js             # 認證路由
│   ├── tasks.js            # 任務路由
│   ├── users.js            # 用戶路由
│   └── chat.js             # 聊天路由
├── middleware/              # 中間件
│   └── auth.js             # 認證中間件
└── client/                  # 前端項目
    ├── public/
    ├── src/
    │   ├── components/      # 組件
    │   │   ├── Layout/     # 佈局組件
    │   │   └── Auth/       # 認證組件
    │   ├── contexts/       # React上下文
    │   │   ├── AuthContext.js
    │   │   └── SocketContext.js
    │   ├── pages/          # 頁面組件
    │   │   ├── Home.js
    │   │   ├── Auth/
    │   │   ├── Tasks/
    │   │   ├── Profile/
    │   │   ├── Chat/
    │   │   └── NotFound.js
    │   ├── App.js          # 主應用組件
    │   ├── index.js        # 前端入口
    │   └── index.css       # 全局樣式
    └── package.json        # 前端依賴配置
```

## 快速開始

### 環境要求
- Node.js 16+
- MongoDB 4.4+
- npm 或 yarn

### 安裝步驟

1. **克隆項目**
   ```bash
   git clone <repository-url>
   cd campus-task-platform
   ```

2. **安裝後端依賴**
   ```bash
   npm install
   ```

3. **安裝前端依賴**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **配置環境變量**
   
   複製 `.env.example` 為 `.env` 並配置：
   ```env
   MONGODB_URI=mongodb://localhost:27017/campus_tasks
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

5. **啟動MongoDB**
   
   確保MongoDB服務正在運行

6. **啟動後端服務**
   ```bash
   npm run dev
   ```

7. **啟動前端服務**
   ```bash
   cd client
   npm start
   ```

8. **訪問應用**
   
   打開瀏覽器訪問 `http://localhost:3000`

## API文檔

### 認證接口
- `POST /auth/register` - 用戶註冊
- `POST /auth/login` - 用戶登錄
- `POST /auth/refresh` - 刷新令牌
- `POST /auth/verify` - 驗證令牌
- `PUT /auth/change-password` - 修改密碼

### 任務接口
- `GET /tasks` - 獲取任務列表
- `GET /tasks/:id` - 獲取任務詳情
- `POST /tasks` - 發布任務
- `PUT /tasks/:id/apply` - 申請任務
- `PUT /tasks/:id/accept` - 接受申請
- `PUT /tasks/:id/complete` - 完成任務
- `PUT /tasks/:id/cancel` - 取消任務

### 用戶接口
- `GET /users/profile` - 獲取個人資料
- `PUT /users/profile` - 更新個人資料
- `GET /users/:id/profile` - 獲取用戶公開資料
- `GET /users/stats` - 獲取用戶統計

### 聊天接口
- `GET /chat/messages` - 獲取聊天記錄
- `POST /chat/send` - 發送消息
- `GET /chat/rooms` - 獲取聊天室列表
- `PUT /chat/read` - 標記消息已讀

## 部署說明

### 生產環境部署

1. **構建前端**
   ```bash
   cd client
   npm run build
   ```

2. **配置生產環境變量**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   PORT=5000
   ```

3. **啟動生產服務**
   ```bash
   npm start
   ```

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:16-alpine

WORKDIR /app

# 複製package.json
COPY package*.json ./
COPY client/package*.json ./client/

# 安裝依賴
RUN npm install
RUN cd client && npm install

# 複製源碼
COPY . .

# 構建前端
RUN cd client && npm run build

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["npm", "start"]
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打開 Pull Request

## 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 聯繫方式

- 項目鏈接：[GitHub Repository]
- 問題反饋：[GitHub Issues]

## 更新日誌

### v1.0.0 (2024-01-20)
- ✨ 初始版本發布
- 🎯 基礎任務發布和申請功能
- 💬 實時聊天系統
- 👤 用戶認證和資料管理
- 📱 響應式設計支持

---

**感谢使用校园任务平台！如果您觉得这个项目有用，请给我们一个 ⭐**