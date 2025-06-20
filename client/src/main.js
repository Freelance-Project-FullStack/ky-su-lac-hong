import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/popup-styles.css';
import App from './App.jsx';

// Xử lý lỗi toàn cục
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Ngăn chặn hiển thị hộp thoại lỗi của trình duyệt
  event.preventDefault();
  return false;
});

// Xử lý promise rejection không được bắt
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Ngăn chặn hiển thị hộp thoại lỗi của trình duyệt
  event.preventDefault();
  return false;
});

// Xử lý đóng/làm mới trình duyệt - ngắt kết nối socket và rời phòng
window.addEventListener('beforeunload', () => {
  console.log('Browser closing/refreshing - cleaning up...');
  if (window.socketService && window.socketService.isConnected) {
    window.socketService.disconnect();
  }
  return undefined;
});

// Xử lý thay đổi hiển thị trang (khi người dùng chuyển tab hoặc thu nhỏ)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden - user switched tab or minimized');
  } else {
    console.log('Page visible - user returned to tab');
  }
});

// Khởi tạo ứng dụng React
console.log('🚀 Initializing React app...');
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found! Make sure there is a div with id "root" in your HTML');
}


