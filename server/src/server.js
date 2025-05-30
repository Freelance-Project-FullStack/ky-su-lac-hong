// server/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path'); // Để phục vụ client tĩnh (nếu có)

const socketHandlers = require('./sockets/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả các origin (thay đổi thành domain client của bạn khi deploy)
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// (Tùy chọn) Phục vụ các file tĩnh từ thư mục client/public (nếu bạn build client ra đây)
// app.use(express.static(path.join(__dirname, '..', '..', 'client', 'public')));
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', '..', 'client', 'public', 'index.html'));
// });


// Khởi tạo socket handlers
socketHandlers(io);

server.listen(PORT, () => {
  console.log(`Ky Su Lac Hong server is running on http://localhost:${PORT}`);
});