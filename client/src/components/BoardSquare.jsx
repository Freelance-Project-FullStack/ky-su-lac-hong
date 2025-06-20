import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BoardEffects from './BoardEffects.jsx';

const SquareWrapper = styled(motion.div)`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  transform-origin: center;
`;

const SquareContent = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  /* Thay đổi clip-path để các ô vuông vắn hơn, giống hình mẫu */
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  background: ${props => props.colors.gradient};
  border: 1px solid ${props => props.colors.border};
  box-shadow: ${props => props.colors.shadow};
  color: #000;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden; /* Đảm bảo hình ảnh không tràn ra ngoài */

  &:hover {
    filter: brightness(1.1);
    box-shadow: ${props => props.colors.borderGlow};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    filter: brightness(0.95);
  }

  ${props => props.isSelected && `
    border-width: 2px;
    box-shadow: ${props.colors.borderGlow};
    filter: brightness(1.1);
  `}

  ${props => props.isActive && `
    animation: pulse 1.5s ease-in-out;
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
  `}
`;

const SquareIcon = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3));
  /* Thêm hiệu ứng phóng to khi hover */
  transition: all 0.3s ease;
  ${props => props.isActive && `transform: scale(1.15); filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.4));`}
`;

const SquareName = styled.div`
  font-size: 14px;
  font-weight: bold;
  white-space: pre-line;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  margin-top: 5px;
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.colors ? props.colors.gradient : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-line;
  pointer-events: none;
  z-index: 100;
  box-shadow: ${props => props.colors ? props.colors.shadow : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  border: 2px solid ${props => props.colors ? props.colors.border : 'rgba(255, 255, 255, 0.1)'};
  min-width: 200px;
  text-align: center;

  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid ${props => props.colors ? props.colors.border : 'rgba(0, 0, 0, 0.9)'};
  }

  .tooltip-title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
    color: ${props => props.colors ? props.colors.bg : 'white'};
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .tooltip-type {
    font-style: italic;
    margin-bottom: 8px;
    opacity: 0.9;
  }

  .tooltip-description {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const BoardSquare = ({ square, position, angle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsActive(false);
  };

  const handleClick = () => {
    setIsSelected(!isSelected);
  };

  const tooltipVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  const squareVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <SquareWrapper
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      variants={squareVariants}
    >
      <SquareContent
        colors={square.colors}
        isActive={isActive}
        isSelected={isSelected}
      >
        {/* Hiệu ứng đặc biệt cho từng ô */}
        <BoardEffects
          type={square.type}
          colors={square.colors}
          isActive={isActive}
          isSelected={isSelected}
        />

        {/* Tooltip hiển thị thông tin chi tiết */}
        <AnimatePresence>
          {isHovered && (
            <Tooltip
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={tooltipVariants}
              colors={square.colors}
            >
              <div className="tooltip-title">{square.name}</div>
              <div className="tooltip-type">{`Loại: ${square.type}`}</div>
              <div className="tooltip-description">
                {square.type === 'land' && (
                  <>
                    Giá: 100 xu
                    <br />
                    Có thể xây dựng nhà, khách sạn
                    <br />
                    Thu tiền thuê khi người khác dừng chân
                  </>
                )}
                {square.type === 'water' && (
                  <>
                    Không thể xây dựng
                    <br />
                    Phải trả phí qua lại
                    <br />
                    Phí tăng theo số ô nước sở hữu
                  </>
                )}
                {square.type === 'special' && (
                  <>
                    Sự kiện đặc biệt
                    <br />
                    Có thể nhận thưởng hoặc phạt
                    <br />
                    Kích hoạt hiệu ứng đặc biệt
                  </>
                )}
                {square.type === 'corner' && (
                  <>
                    Góc đặc biệt
                    <br />
                    Có hiệu ứng riêng
                    <br />
                    Ảnh hưởng đến toàn bộ người chơi
                  </>
                )}
              </div>
            </Tooltip>
          )}
        </AnimatePresence>

        {/* Icon và tên của ô */}
        <SquareIcon 
          src={square.icon} 
          alt={square.name}
          isActive={isActive}
          style={{
            transform: `rotate(${-angle}deg) ${isActive ? 'translateY(-3px)' : ''}`,
            filter: isActive ? 'brightness(1.2) drop-shadow(0 5px 8px rgba(0, 0, 0, 0.4))' : 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3))'
          }}
        />
        <SquareName
          style={{
            transform: `rotate(${-angle}deg)`,
            opacity: isActive ? 1 : 0.9
          }}
        >
          {square.name}
        </SquareName>
      </SquareContent>
    </SquareWrapper>
  );
};

export default BoardSquare;
