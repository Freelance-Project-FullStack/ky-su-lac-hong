import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { BOARD_LAYOUT, COLOR_GROUPS } from "../gameObjects/BoardConfig";
import { useGameBoard, SQUARE_DIMENSIONS } from "../hooks/useGameBoard";
import BoardSquare from "./BoardSquare.jsx";
import CentralCardArea from "./CentralCardArea.jsx";

const BoardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Nền chính của bàn cờ giờ sẽ là logo Ký Sự Lạc Hồng */
  background: url("/assets/images/board/mat_ban_co.png") center center no-repeat;
  background-size: cover;
  overflow: hidden;
`;

const GameBoardArea = styled.div`
  position: relative;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BoardWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  transform-origin: center;
`;

const GameBoard = () => {
  const { boardSize, getSquarePosition, getSquareAngle } = useGameBoard();
  const totalSquares = BOARD_LAYOUT.length;

  const currentLayout = BOARD_LAYOUT;

  return (
    <BoardContainer>
      <GameBoardArea size={boardSize}>
        <CentralCardArea />

        <BoardWrapper
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {currentLayout.map((squareData, index) => {
            const position = getSquarePosition(index, totalSquares);
            const angle = getSquareAngle(index, totalSquares);

            const backgroundImage = squareData.iconKey
              ? `/assets/images/board/${squareData.iconKey}.png`
              : "/assets/images/board/default_bg.png"; // Thêm ảnh nền mặc định

            const isCorner = squareData.type === "corner";
            const squareWidth = isCorner
              ? SQUARE_DIMENSIONS.CORNER
              : SQUARE_DIMENSIONS.SHORT_SIDE;
            const squareHeight = isCorner
              ? SQUARE_DIMENSIONS.CORNER
              : SQUARE_DIMENSIONS.LONG_SIDE;

            return (
              <BoardSquare
                key={squareData.id}
                square={squareData}
                position={position}
                angle={angle}
                width={squareWidth}
                height={squareHeight}
                backgroundImage={backgroundImage}
              />
            );
          })}
        </BoardWrapper>
      </GameBoardArea>
    </BoardContainer>
  );
};

export default GameBoard;
