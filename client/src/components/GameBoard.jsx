import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { BOARD_LAYOUT } from '../gameObjects/BoardConfig';
import { useGameBoard } from '../hooks/useGameBoard';
import { useGameBoardContext } from '../contexts/GameBoardContext.jsx';
import BoardSquare from './BoardSquare.jsx';

// Styled components cho bàn cờ
const BoardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('/assets/images/board/mat_ban_co.png') center center no-repeat;
  background-size: cover; /* Thay đổi từ contain sang cover để phủ toàn bộ */
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.05); /* Giảm độ mờ */
    pointer-events: none;
  }
`;

const BoardWrapper = styled(motion.div)`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  display: grid;
  place-items: center;
  transform-origin: center;
  /* Thêm hiệu ứng 3D nhẹ */
  transform-style: preserve-3d;
  perspective: 1000px;
`;

const GameBoard = () => {
  const {
    boardSize,
    squareSize,
    getSquarePosition,
    getSquareAngle,
    getSquareColors
  } = useGameBoard();

  const {
    hoveredSquare,
    setHoveredSquare,
    handleSquareClick,
    getSquareState
  } = useGameBoardContext();

  return (
    <BoardContainer>
      <BoardWrapper
        size={boardSize}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {BOARD_LAYOUT.map((square, index) => {
          const position = getSquarePosition(index);
          const angle = getSquareAngle(index);
          const colors = getSquareColors(square.type);
          
          return (
            <BoardSquare
              key={index}
              square={{
                ...square,
                colors,
                icon: square.key ? `/assets/images/board/${square.key}.png` : null
              }}
              position={position}
              angle={angle}
            />
          );
        })}
      </BoardWrapper>
    </BoardContainer>
  );
};

export default GameBoard;
