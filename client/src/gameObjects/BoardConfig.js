// client/src/gameObjects/BoardConfig.js
// Cấu hình bàn cờ Kỳ Sư Lạc Hồng

export const BOARD_LAYOUT = [
  // Cạnh dưới (từ trái sang phải)
  { type: 'corner', name: 'Nhà Tù', key: 'tu', color: 0x000000 },
  { type: 'land', name: 'Thành\nCổ Loa', key: 'nui_1', color: 0x9370DB },
  { type: 'water', name: 'Sông\nHồng', key: 'song', color: 0x9370DB },
  { type: 'land', name: 'Làng\nHy Cương', key: 'nui_2', color: 0x9370DB },
  { type: 'land', name: 'Núi\nNghĩa Lĩnh', key: 'nui_1', color: 0x9370DB },
  { type: 'special', name: 'Sự Kiện', key: null, color: 0xFF5733 },
  { type: 'land', name: 'Thành\nTây Vu', key: 'nui_2', color: 0x9370DB },
  { type: 'land', name: 'Làng\nĐông Sơn', key: 'nui_1', color: 0x9370DB },
  { type: 'land', name: 'Làng\nĐồng Cổ', key: 'nui_2', color: 0x9370DB },
  { type: 'corner', name: 'Lập Quốc', key: null, color: 0x000000 },
  
  // Cạnh phải (từ dưới lên trên)
  { type: 'land', name: 'Chùa\nHội Phước', key: 'nui_1', color: 0x4682B4 },
  { type: 'land', name: 'Địa đạo\nCủ Chi', key: 'nui_2', color: 0x4682B4 },
  { type: 'land', name: 'Phước\nVĩnh An', key: 'nui_1', color: 0x4682B4 },
  { type: 'special', name: 'Thuế', key: 'thue', color: 0xFF5733 },
  { type: 'land', name: 'Bản\nMười Phăng', key: 'nui_2', color: 0x4682B4 },
  { type: 'water', name: 'Sông\nBến Hải', key: 'song', color: 0x4682B4 },
  { type: 'land', name: 'Điện\nBiên Phủ', key: 'nui_1', color: 0x4682B4 },
  { type: 'land', name: 'Chùa\nThạch Long', key: 'nui_2', color: 0x4682B4 },
  { type: 'corner', name: 'Ngựa Ô', key: 'ngua', color: 0x000000 },
  
  // Cạnh trên (từ phải sang trái)
  { type: 'land', name: 'Chùa\nMột Cột', key: 'nui_1', color: 0x228B22 },
  { type: 'water', name: 'Thành\nThăng Long', key: 'nui_2', color: 0x228B22 },
  { type: 'water', name: 'Kê\nChợ', key: 'nui_1', color: 0x228B22 },
  { type: 'special', name: 'Sự kiện', key: null, color: 0xFF5733 },
  { type: 'land', name: 'Chùa\nThiên Mụ', key: 'nui_2', color: 0x228B22 },
  { type: 'land', name: 'Kinh thành\nHuế', key: 'nui_1', color: 0x228B22 },
  { type: 'water', name: 'Sông\nNhư Nguyệt', key: 'song', color: 0x228B22 },
  { type: 'land', name: 'Bao Vinh', key: 'nui_2', color: 0x228B22 },
  { type: 'corner', name: 'Lễ hội\nTruyền thống', key: 'co', color: 0x000000 },
    
  // Cạnh trái (từ trên xuống dưới)
  { type: 'land', name: 'Thuận Thành', key: 'nui_1', color: 0xCD5C5C },
  { type: 'land', name: 'Luy Lâu', key: 'nui_2', color: 0xCD5C5C },
  { type: 'water', name: 'Sông\nBạch Đằng', key: 'song', color: 0xCD5C5C },
  { type: 'land', name: 'Chùa Dâu', key: 'nui_1', color: 0xCD5C5C },
  { type: 'special', name: 'Sự kiện', key: null, color: 0xFF5733 },
  { type: 'land', name: 'Tống Bình', key: 'nui_2', color: 0xCD5C5C },
  { type: 'land', name: 'Thành\nĐại La', key: 'nui_1', color: 0xCD5C5C },
  { type: 'land', name: 'Chùa\nBút Tháp', key: 'nui_2', color: 0xCD5C5C },
];

// Cấu hình cho các loại ô
export const SQUARE_TYPES = {
  land: {
    topShape: 'nui', // Hình núi cho ô đất
    textColor: '#FFFFFF'
  },
  water: {
    topShape: 'song', // Hình sóng cho ô nước
    textColor: '#FFFFFF'
  },
  special: {
    textColor: '#000000'
  },
  corner: {
    textColor: '#FFFFFF'
  }
};

// Cấu hình màu sắc cho các nhóm ô
export const COLOR_GROUPS = {
  purple: 0x9370DB, // Cạnh dưới
  blue: 0x4682B4,   // Cạnh phải
  green: 0x228B22,  // Cạnh trên
  red: 0xCD5C5C     // Cạnh trái
};
