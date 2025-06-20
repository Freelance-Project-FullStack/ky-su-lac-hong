import { useState, useCallback, useEffect } from 'react';
import { BOARD_LAYOUT } from '../gameObjects/BoardConfig';

export const useGameBoard = () => {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [activeSquare, setActiveSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [boardSize, setBoardSize] = useState(0);
  const [squareSize, setSquareSize] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Tính toán kích thước bàn cờ dựa trên kích thước màn hình
  useEffect(() => {
    const calculateBoardSize = () => {
      // Tính toán kích thước tối ưu cho bàn cờ
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const maxSize = Math.max(window.innerWidth, window.innerHeight);
      
      // Đảm bảo bàn cờ không quá lớn trên màn hình lớn
      const size = Math.min(
        minSize * 0.9, // 90% kích thước cạnh ngắn
        maxSize * 0.7, // 70% kích thước cạnh dài
        1200 // Giới hạn kích thước tối đa
      );
      
      setBoardSize(size);
      
      // Tính toán kích thước ô dựa trên số ô trên mỗi cạnh
      const squaresPerSide = 9; // Số ô trên mỗi cạnh
      const squareSize = size / (squaresPerSide + 1); // +1 để có khoảng trống
      setSquareSize(squareSize);
    };

    calculateBoardSize();
    
    // Thêm debounce để tránh tính toán quá nhiều khi resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateBoardSize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Tính vị trí của ô dựa trên index
  const getSquarePosition = useCallback((index) => {
    const squaresPerSide = 9;
    const side = Math.floor(index / squaresPerSide);
    const posInSide = index % squaresPerSide;
    
    // Tính toán offset và khoảng cách giữa các ô
    const baseOffset = boardSize * 0.38; // Giảm offset để các ô gần nhau hơn
    const step = squareSize * 1.05; // Giảm khoảng cách giữa các ô để chúng liền mạch hơn
    
    // Tính toán vị trí cơ bản
    let x = 0;
    let y = 0;
    
    // Hệ số điều chỉnh cho từng cạnh
    const sideOffsets = {
      horizontal: baseOffset * 0.98,
      vertical: baseOffset * 0.98
    };
    
    // Tính toán vị trí dựa trên cạnh
    switch (side) {
      case 0: // Cạnh dưới
        x = -sideOffsets.horizontal + (posInSide + 0.5) * step;
        y = sideOffsets.vertical;
        break;
      case 1: // Cạnh phải
        x = sideOffsets.horizontal;
        y = sideOffsets.vertical - (posInSide + 0.5) * step;
        break;
      case 2: // Cạnh trên
        x = sideOffsets.horizontal - (posInSide + 0.5) * step;
        y = -sideOffsets.vertical;
        break;
      case 3: // Cạnh trái
        x = -sideOffsets.horizontal;
        y = -sideOffsets.vertical + (posInSide + 0.5) * step;
        break;
    }

    // Điều chỉnh vị trí cho các ô góc
    const square = BOARD_LAYOUT[index];
    if (square.type === 'corner') {
      const cornerOffset = step * 0.1; // Giảm offset góc để ô góc gần với các ô khác hơn
      
      // Tính toán offset cho từng góc
      const cornerAdjustments = {
        'Lập Quốc': { x: cornerOffset, y: -cornerOffset }, // Góc dưới phải
        'Ngựa Ô': { x: -cornerOffset, y: -cornerOffset }, // Góc phải trên
        'Lễ hội\nTruyền thống': { x: -cornerOffset, y: cornerOffset }, // Góc trên trái
        'Nhà Tù': { x: cornerOffset, y: cornerOffset } // Góc trái dưới
      };
      
      const adjustment = cornerAdjustments[square.name];
      if (adjustment) {
        x += adjustment.x;
        y += adjustment.y;
      }
    }
    
    // Điều chỉnh vị trí cho các ô đặc biệt
    if (square.type === 'special') {
      const specialOffset = step * 0.05; // Offset nhỏ cho các ô đặc biệt
      x += (Math.random() - 0.5) * specialOffset;
      y += (Math.random() - 0.5) * specialOffset;
    }
    
    return { x, y };
  }, [boardSize, squareSize]);

  // Tính góc xoay của ô
  const getSquareAngle = useCallback((index) => {
    const squaresPerSide = 9;
    const side = Math.floor(index / squaresPerSide);
    const square = BOARD_LAYOUT[index];
    
    // Góc xoay cơ bản cho từng cạnh
    const sideAngles = [0, 90, 180, -90];
    let angle = sideAngles[side];

    // Điều chỉnh góc xoay cho các loại ô đặc biệt
    if (square.type === 'corner') {
      const cornerAngles = {
        'Lập Quốc': 45,
        'Ngựa Ô': 135,
        'Lễ hội\nTruyền thống': -135,
        'Nhà Tù': -45
      };
      angle = cornerAngles[square.name] || angle;
    } else if (square.type === 'special') {
      // Thêm hiệu ứng xoay nhẹ ngẫu nhiên cho các ô đặc biệt
      angle += (Math.random() - 0.5) * 5;
    }
    
    return angle;
  }, []);

  // Lấy màu sắc và hiệu ứng cho từng loại ô
  const getSquareColors = useCallback((type) => {
    const colors = {
      land: {
        bg: '#E6D5AC',
        border: '#8B4513',
        gradient: `
          linear-gradient(
            135deg,
            rgba(245, 230, 203, 0.9) 0%,
            rgba(230, 213, 172, 0.95) 50%,
            rgba(139, 69, 19, 0.2) 100%
          )
        `,
        shadow: '0 4px 8px rgba(139, 69, 19, 0.3)',
        borderGlow: '0 0 10px rgba(139, 69, 19, 0.5)'
      },
      water: {
        bg: '#ADD8E6',
        border: '#4682B4',
        gradient: `
          linear-gradient(
            135deg,
            rgba(191, 227, 240, 0.9) 0%,
            rgba(173, 216, 230, 0.95) 50%,
            rgba(70, 130, 180, 0.2) 100%
          )
        `,
        shadow: '0 4px 8px rgba(70, 130, 180, 0.3)',
        borderGlow: '0 0 15px rgba(70, 130, 180, 0.6)'
      },
      special: {
        bg: '#FFD700',
        border: '#DAA520',
        gradient: `
          linear-gradient(
            135deg,
            rgba(255, 228, 77, 0.9) 0%,
            rgba(255, 215, 0, 0.95) 50%,
            rgba(218, 165, 32, 0.2) 100%
          )
        `,
        shadow: '0 4px 12px rgba(218, 165, 32, 0.4)',
        borderGlow: '0 0 20px rgba(255, 215, 0, 0.7)'
      },
      corner: {
        bg: '#DC143C',
        border: '#8B0000',
        gradient: `
          linear-gradient(
            135deg,
            rgba(255, 26, 26, 0.9) 0%,
            rgba(220, 20, 60, 0.95) 50%,
            rgba(139, 0, 0, 0.2) 100%
          )
        `,
        shadow: '0 4px 15px rgba(139, 0, 0, 0.5)',
        borderGlow: '0 0 25px rgba(220, 20, 60, 0.8)'
      },
      default: {
        bg: '#FFFFFF',
        border: '#000000',
        gradient: `
          linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(240, 240, 240, 0.95) 50%,
            rgba(200, 200, 200, 0.2) 100%
          )
        `,
        shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderGlow: '0 0 8px rgba(0, 0, 0, 0.2)'
      }
    };

    // Thêm hiệu ứng động cho các ô đặc biệt
    const getAnimatedGradient = (baseColors) => {
      if (type === 'special' || type === 'corner') {
        return `
          ${baseColors.gradient},
          radial-gradient(
            circle at ${50 + Math.random() * 20}% ${50 + Math.random() * 20}%,
            rgba(255, 255, 255, 0.8) 0%,
            transparent 60%
          )
        `;
      }
      return baseColors.gradient;
    };

    const baseColors = colors[type] || colors.default;
    return {
      ...baseColors,
      gradient: getAnimatedGradient(baseColors)
    };
  }, []);

  // Xử lý hover
  const handleSquareHover = useCallback((index) => {
    if (!isAnimating) {
      setHoveredSquare(index);
    }
  }, [isAnimating]);

  // Xử lý hover out
  const handleSquareLeave = useCallback(() => {
    setHoveredSquare(null);
  }, []);

  // Xử lý click
  const handleSquareClick = useCallback((index) => {
    if (!isAnimating) {
      setActiveSquare(index);
      setSelectedSquare(index === selectedSquare ? null : index);
      setIsAnimating(true);

      // Reset trạng thái active sau animation
      setTimeout(() => {
        setActiveSquare(null);
        setIsAnimating(false);
      }, 1500);
    }
  }, [selectedSquare, isAnimating]);

  // Lấy trạng thái của ô
  const getSquareState = useCallback((index) => {
    return {
      isHovered: hoveredSquare === index,
      isActive: activeSquare === index,
      isSelected: selectedSquare === index,
      isAnimating: isAnimating && activeSquare === index
    };
  }, [hoveredSquare, activeSquare, selectedSquare, isAnimating]);

  return {
    hoveredSquare,
    activeSquare,
    selectedSquare,
    boardSize,
    squareSize,
    isAnimating,
    getSquarePosition,
    getSquareAngle,
    getSquareColors,
    handleSquareHover,
    handleSquareLeave,
    handleSquareClick,
    getSquareState
  };
};
