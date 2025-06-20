import React, { createContext, useContext, useState, useCallback } from 'react';
import { BOARD_LAYOUT } from '../gameObjects/BoardConfig';

const GameBoardContext = createContext();

export const useGameBoardContext = () => {
  const context = useContext(GameBoardContext);
  if (!context) {
    throw new Error('useGameBoardContext must be used within a GameBoardProvider');
  }
  return context;
};

export const GameBoardProvider = ({ children }) => {
  const [activeSquare, setActiveSquare] = useState(null);
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedSquares, setSelectedSquares] = useState([]);

  const handleSquareClick = useCallback((index) => {
    setActiveSquare(index);
    const square = BOARD_LAYOUT[index];
    
    // Logic xử lý click tùy theo loại ô
    switch (square.type) {
      case 'land':
        // Thêm/xóa khỏi danh sách ô đã chọn
        setSelectedSquares(prev => {
          const isSelected = prev.includes(index);
          return isSelected 
            ? prev.filter(i => i !== index)
            : [...prev, index];
        });
        break;
        
      case 'special':
        // Kích hoạt hiệu ứng đặc biệt
        console.log('Kích hoạt hiệu ứng đặc biệt:', square.name);
        break;
        
      case 'corner':
        // Xử lý logic góc đặc biệt
        console.log('Xử lý góc đặc biệt:', square.name);
        break;
        
      default:
        console.log('Click ô thường:', square.name);
    }

    // Tự động reset active square sau 1.5s
    setTimeout(() => {
      setActiveSquare(null);
    }, 1500);
  }, []);

  const value = {
    activeSquare,
    hoveredSquare,
    selectedSquares,
    setHoveredSquare,
    handleSquareClick,
    getSquareState: useCallback((index) => ({
      isActive: activeSquare === index,
      isHovered: hoveredSquare === index,
      isSelected: selectedSquares.includes(index)
    }), [activeSquare, hoveredSquare, selectedSquares])
  };

  return (
    <GameBoardContext.Provider value={value}>
      {children}
    </GameBoardContext.Provider>
  );
};
