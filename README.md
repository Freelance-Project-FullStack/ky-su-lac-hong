# Kỳ Sử Lạc Hồng - Board Game Online

## Giới thiệu

"Kỳ sử Lạc Hồng" là một board game mô phỏng quá trình hình thành và phát triển đất nước qua các thời kỳ lịch sử Việt Nam. Trò chơi phù hợp cho 2-4 người chơi, mang yếu tố chiến lược, giáo dục lịch sử và tinh thần xây dựng quốc gia.

## Thành phần Game

### Bàn cờ
- **40 ô** chia thành các vùng đất lịch sử, sự kiện quốc gia, cơ hội, thử thách, di tích, thủ đô
- **4 thời kỳ lịch sử**: Hùng Vương, Lý, Trần, Lê
- **4 con sông** đại diện cho 4 thời kỳ
- **Các ô đặc biệt**: Ngựa Ô, Lễ hội, Giam cầm, Thuế

### Tiền tệ
- **Vàng** với các mệnh giá: 5.000, 10.000, 20.000, 50.000, 100.000, 200.000, 500.000
- **Số tiền ban đầu**: 2.000.000 vàng mỗi người

### Thẻ bài
- **Thẻ sự kiện**: Cơ hội và Vận Mệnh (10 thẻ)
- **Thẻ nhân vật lịch sử**: 10 thẻ với sức mạnh đặc biệt

### Công trình
- **Cơ bản**: Đền, Thành, Nhà
- **Nâng cấp**: Chùa (từ 3 Đền), Khu quân sự (từ 3 Thành), Làng (từ 3 Nhà)

## Luật chơi

### Chuẩn bị
1. Mỗi người chọn 1 quân cờ và nhận 2.000.000 vàng
2. Mỗi người bốc 1 thẻ nhân vật lịch sử
3. Bắt đầu từ ô "LẬP QUỐC"

### Lượt chơi
1. **Tung xúc xắc** và di chuyển
2. **Thực hiện hành động** tại ô đáp xuống:
   - Mua đất trống
   - Trả thuê nếu đất có chủ
   - Xây dựng công trình trên đất của mình
   - Rút thẻ sự kiện
   - Thực hiện hành động đặc biệt

### Luật đặc biệt

#### Xây dựng và nâng cấp
- Xây 3 công trình cùng loại → tự động nâng cấp
- Đất đã nâng cấp **không thể bị mua lại**

#### Thách đấu
- Khi đáp vào đất người khác, có thể chọn:
  - Trả tiền thuê
  - Mua lại với giá 150% giá gốc
  - **Thách đấu**: Tung xúc xắc, người thắng chiếm đất

#### Giam cầm
- Tung 3 lần xúc xắc đôi liên tiếp → giam cầm 3 lượt
- Cách thoát: Nộp phạt, dùng thẻ, hoặc tung xúc xắc đôi

#### Ô đặc biệt
- **Ngựa Ô**: Chọn di chuyển đến ô bất kỳ
- **Lễ hội**: Tăng gấp đôi thuế tại 1 vùng đất sở hữu

### Điều kiện thắng
1. **Thống nhất lãnh thổ**: Sở hữu 8 ô cùng 1 thời kỳ
2. **Chiếm 4 con sông** của 4 thời kỳ khác nhau
3. **Đạt 3 bộ độc quyền** (monopoly)
4. **Người giàu nhất** khi hết thời gian
5. **Người sống sót cuối cùng** (người khác phá sản)

## Công nghệ

### Backend
- **Node.js** + **Express**
- **Socket.IO** cho multiplayer real-time
- **Game logic** hoàn chỉnh với các class: GameManager, Player, Board, Square

### Frontend
- **Phaser 3** game engine
- **Webpack** build system
- **Socket.IO Client** cho kết nối real-time

### Cấu trúc dự án
```
ky-su-lac-hong/
├── client/                 # Frontend (Phaser 3)
│   ├── src/
│   │   ├── scenes/        # Game scenes
│   │   ├── services/      # Socket service
│   │   └── ui/           # UI components
│   └── public/           # Assets
└── server/               # Backend (Node.js)
    ├── src/
    │   ├── game/         # Game logic
    │   ├── data/         # Game data (cards, squares)
    │   └── sockets/      # Socket handlers
    └── tests/
```

## Cài đặt và chạy

### Yêu cầu hệ thống
- **Node.js** 18+
- **npm** 8+
- **Docker** (cho MongoDB)
- **Git**

### Cách 1: Chạy Development (Khuyến nghị)

#### Bước 1: Clone repository
```bash
git clone <repository-url>
cd ky-su-lac-hong
```

#### Bước 2: Cài đặt dependencies
```bash
npm run install:all
```

#### Bước 3: Chạy development server
```bash
npm run dev
# hoặc
./start-dev.sh
```

Script sẽ tự động:
- Khởi động MongoDB với Docker
- Cài đặt dependencies nếu cần
- Chạy server (port 3000)
- Chạy client (port 8080)

#### Bước 4: Truy cập game
Mở trình duyệt và vào: **http://localhost:8080**

### Cách 2: Chạy với Docker Compose

```bash
# Build và chạy tất cả services
npm run build
npm start

# Dừng services
npm stop

# Dọn dẹp
npm run clean
```

### Cách 3: Chạy thủ công

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm start
```

#### MongoDB
```bash
docker run -d \
  --name ky-su-lac-hong-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0
```

## Tính năng đã hoàn thành

### ✅ **Backend - Server & Database**
- **MongoDB** integration với Docker
- **Authentication** system (JWT)
- **User management** (register, login, profile)
- **Game rooms** (create, join, leave)
- **Real-time multiplayer** với Socket.IO
- **Game history** và statistics
- **Leaderboard** system
- **Rate limiting** và security

### ✅ **Game Logic hoàn chỉnh**
- **40 ô bàn cờ** với đầy đủ thời kỳ lịch sử
- **4 người chơi**, mỗi người 2.000.000 vàng ban đầu
- **Tung xúc xắc** và di chuyển tự động
- **Mua đất, xây dựng** công trình (Đền, Thành, Nhà)
- **Nâng cấp tự động**: 3 công trình → 1 nâng cấp
- **Bảo vệ** khỏi mua lại sau khi nâng cấp

### ✅ **Hệ thống thẻ bài**
- **10 thẻ sự kiện** (Cơ hội + Vận mệnh)
- **10 thẻ nhân vật lịch sử** với sức mạnh đặc biệt
- **Mỗi người nhận 1 thẻ** nhân vật từ đầu game

### ✅ **Tính năng nâng cao**
- **Thách đấu** giữa người chơi (tung xúc xắc)
- **Giam cầm 3 lượt** khi tung đôi 3 lần liên tiếp
- **Ô đặc biệt**: Ngựa Ô (chọn ô bất kỳ), Lễ hội (tăng thuế)
- **Hệ thống liên minh** 4 lượt

### ✅ **Điều kiện thắng theo docs**
- **Thống nhất lãnh thổ** (8 ô cùng thời kỳ)
- **Chiếm 4 con sông** 4 thời kỳ khác nhau
- **Đạt 3 bộ độc quyền** (monopoly)
- **Người sống sót cuối cùng**
- **Người giàu nhất** khi hết thời gian

### ✅ **Frontend - UI/UX hoàn chỉnh**
- **Login/Register** system với validation
- **Main Menu** với room management
- **Game UI** với interactive controls
- **Real-time chat** trong game
- **Game log** và notifications
- **Responsive design**
- **Error handling** và offline detection

## Hướng dẫn sử dụng

### 🎮 **Cách chơi**

1. **Đăng ký/Đăng nhập**
   - Tạo tài khoản mới hoặc đăng nhập
   - Có thể chơi thử với tài khoản Guest

2. **Tạo/Tham gia phòng**
   - **Create Room**: Tạo phòng mới (2-4 người)
   - **Quick Join**: Tham gia phòng có sẵn
   - **Join Room**: Nhập mã phòng cụ thể

3. **Trong game**
   - **Roll Dice**: Tung xúc xắc để di chuyển
   - **Buy Property**: Mua đất khi dừng lại
   - **Build**: Xây dựng công trình trên đất sở hữu
   - **Chat**: Trò chuyện với người chơi khác

### 🎯 **Mục tiêu thắng**
- Thống nhất 8 ô cùng thời kỳ lịch sử
- Chiếm 4 con sông của 4 thời kỳ khác nhau
- Đạt 3 bộ độc quyền
- Là người sống sót cuối cùng

### 🛠️ **Troubleshooting**

**Lỗi kết nối:**
```bash
# Kiểm tra MongoDB
docker ps | grep mongodb

# Restart services
npm stop && npm start
```

**Lỗi port đã sử dụng:**
```bash
# Kill process trên port 3000
lsof -ti:3000 | xargs kill -9

# Kill process trên port 8080
lsof -ti:8080 | xargs kill -9
```

**Reset database:**
```bash
docker stop ky-su-lac-hong-mongodb
docker rm ky-su-lac-hong-mongodb
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Thông tin user hiện tại

### Game Endpoints
- `GET /api/game/rooms` - Danh sách phòng
- `POST /api/game/rooms` - Tạo phòng mới
- `POST /api/game/rooms/:id/join` - Tham gia phòng
- `GET /api/game/history` - Lịch sử game
- `GET /api/game/leaderboard` - Bảng xếp hạng

## Roadmap

### 🔄 **Version 1.1 (Đang phát triển)**
- **Sound effects** và background music
- **Animation effects** cho di chuyển và xây dựng
- **Mobile responsive** design
- **AI player** (chế độ 1 người)

### 📋 **Version 1.2 (Kế hoạch)**
- **Tournament mode** với bracket system
- **Replay system** để xem lại ván đấu
- **Advanced statistics** và analytics
- **Custom game rules** settings

### 🚀 **Version 2.0 (Tương lai)**
- **3D board** với Babylon.js
- **Voice chat** integration
- **Spectator mode**
- **Mobile app** (React Native)

## Đóng góp

Dự án được phát triển theo yêu cầu cụ thể. Mọi đóng góp và phản hồi đều được hoan nghênh!

### Cách đóng góp:
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Troubleshooting](#troubleshooting)
2. Tạo [Issue](https://github.com/your-repo/issues) mới
3. Liên hệ team phát triển

---

**Made with ❤️ by Kỳ Sử Lạc Hồng Team**