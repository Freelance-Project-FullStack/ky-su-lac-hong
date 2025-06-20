import { useState, useCallback, useEffect } from "react";

export const SQUARE_DIMENSIONS = {
  CORNER: 120, // Kích thước ô góc (vuông)
  LONG_SIDE: 110, // Chiều dài của ô thường
  SHORT_SIDE: 90, // Chiều rộng của ô thường
};

export const useGameBoard = () => {
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const calculateBoardSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setBoardSize(vmin);
    };

    calculateBoardSize();
    window.addEventListener("resize", calculateBoardSize);
    return () => window.removeEventListener("resize", calculateBoardSize);
  }, []);

  const getSquarePosition = useCallback(
    (index, totalSquares) => {
      const { CORNER, LONG_SIDE, SHORT_SIDE } = SQUARE_DIMENSIONS;
      const squaresPerSide = totalSquares / 4;

      const propertyStripLength = (squaresPerSide - 1) * SHORT_SIDE;
      const halfBoard = propertyStripLength / 2 + CORNER / 2;

      const side = Math.floor(index / squaresPerSide);
      const posInSide = index % squaresPerSide;

      let x = 0;
      let y = 0;

      if (posInSide === 0) {
        // Xử lý các ô góc
        switch (side) {
          case 0:
            x = halfBoard;
            y = halfBoard;
            break; // Góc dưới phải (Bắt Đầu)
          case 1:
            x = -halfBoard;
            y = halfBoard;
            break; // Góc dưới trái (Nhà Tù)
          case 2:
            x = -halfBoard;
            y = -halfBoard;
            break; // Góc trên trái (Bãi Đậu Xe)
          case 3:
            x = halfBoard;
            y = -halfBoard;
            break; // Góc trên phải (Vào Tù)
        }
      } else {
        // Xử lý các ô thường
        const offsetFromCorner = posInSide * SHORT_SIDE - SHORT_SIDE / 2;
        switch (side) {
          case 0: // Cạnh dưới (từ phải qua trái)
            x = halfBoard - CORNER / 2 - offsetFromCorner;
            y = halfBoard - (LONG_SIDE - CORNER) / 2;
            break;
          case 1: // Cạnh trái (từ dưới lên trên)
            x = -halfBoard + (LONG_SIDE - CORNER) / 2;
            y = halfBoard - CORNER / 2 - offsetFromCorner;
            break;
          case 2: // Cạnh trên (từ trái qua phải)
            x = -halfBoard + CORNER / 2 + offsetFromCorner;
            y = -halfBoard + (LONG_SIDE - CORNER) / 2;
            break;
          case 3: // Cạnh phải (từ trên xuống dưới)
            x = halfBoard - (LONG_SIDE - CORNER) / 2;
            y = -halfBoard + CORNER / 2 + offsetFromCorner;
            break;
        }
      }

      return { x, y };
    },
    [boardSize]
  );

  const getSquareAngle = useCallback((index, totalSquares) => {
    const squaresPerSide = totalSquares / 4;
    const side = Math.floor(index / squaresPerSide);
    const sideAngles = [0, 90, 180, -90];
    return sideAngles[side];
  }, []);

  const getSquareColors = useCallback((type, group) => {
    return {
      gradient: "linear-gradient(145deg, #f9f9f9, #e0e0e0)",
      border: "#cccccc",
      shadow: "inset 0 0 5px rgba(0,0,0,0.1)",
      borderGlow: "0 0 10px rgba(70, 130, 180, 0.5)",
      main: "#333",
    };
  }, []);

  return {
    boardSize,
    getSquarePosition,
    getSquareAngle,
    getSquareColors,
  };
};
