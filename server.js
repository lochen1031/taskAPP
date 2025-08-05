const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 數據庫連接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_tasks', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '數據庫連接錯誤:'));
db.once('open', () => {
  console.log('數據庫連接成功');
});

// 導入路由
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.IO 聊天功能
io.on('connection', (socket) => {
  console.log('用戶連接:', socket.id);

  // 用户认证
  socket.on('authenticate', (data) => {
    socket.userId = data.userId;
    socket.username = data.username;
    console.log(`用戶 ${socket.username} (${socket.userId}) 已認證`);
  });

  // 加入聊天室
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`用戶 ${socket.id} 加入房間 ${roomId}`);
  });

  // 离开聊天室
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`用戶 ${socket.id} 離開房間 ${roomId}`);
  });

  // 發送消息
  socket.on('send_message', (data) => {
    try {
      // 生成聊天室ID
      const Message = require('./models/Message');
      
      // 从socket连接的auth信息中获取senderId
      const senderId = socket.handshake.auth?.userId || socket.userId;
      
      if (!senderId) {
        console.error('Socket消息发送失败: 缺少发送者ID');
        return;
      }
      
      const roomId = Message.createChatRoomId(data.taskId, senderId, data.receiverId);
      
      // 广播消息到聊天室
      io.to(roomId).emit('receive_message', {
        ...data,
        senderId: senderId,
        roomId: roomId,
        timestamp: new Date()
      });
      
      console.log(`消息已发送到房间 ${roomId}`);
    } catch (error) {
      console.error('Socket消息发送错误:', error);
    }
  });

  // 标记消息为已读
  socket.on('mark_as_read', (data) => {
    socket.to(data.chatRoom).emit('message_read', data);
  });

  // 斷開連接
  socket.on('disconnect', () => {
    console.log('用戶斷開連接:', socket.id);
  });
});

// 基礎路由
app.get('/', (req, res) => {
  res.json({ message: '校園任務平台API服務器運行中' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服務器運行在端口 ${PORT}`);
});

module.exports = { app, io };