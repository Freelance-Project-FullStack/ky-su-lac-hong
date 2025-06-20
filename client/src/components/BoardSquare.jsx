import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
// import BoardEffects from "./BoardEffects.jsx";

const SquareWrapper = styled(motion.div)`
  position: absolute;
  transform-origin: center;
  /* Nhận kích thước và ảnh nền từ props */
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  background-image: url(${(props) => props.backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid #555;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* Đổi màu chữ mặc định thành trắng cho dễ đọc */
`;

const SquareContent = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Đẩy tên và giá về 2 phía */
  align-items: center;
  padding: 8px 4px;
  text-align: center;
  cursor: pointer;
  overflow: hidden;

  /* Lớp phủ gradient để làm nổi bật chữ trên ảnh nền */
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 25%,
    transparent 60%
  );

  &:hover {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(0, 0, 0, 0.4) 25%,
      transparent 70%
    );
  }

  &:active {
    transform: translateY(1px);
    filter: brightness(0.95);
  }

  ${(props) =>
    props.isSelected &&
    `
    border-width: 2px;
    box-shadow: ${props.colors.borderGlow};
    filter: brightness(1.1);
  `}

  ${(props) =>
    props.isActive &&
    `
    animation: pulse 1.5s ease-in-out;
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
  `}
`;

const ColorStripe = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 15px; /* Giảm chiều cao thanh màu */
  background-color: ${(props) => props.color};
  border-bottom: 2px solid rgba(0, 0, 0, 0.4);
`;

const SquareName = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-shadow: 1px 1px 3px #000;
  padding: 0 2px;
  margin-top: ${(props) => (props.hasColorStripe ? "15px" : "0")};
`;

const SquarePrice = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-shadow: 1px 1px 3px #000;
`;

// Tooltip giữ nguyên
const Tooltip = styled(motion.div)`
  position: absolute;
  top: -10px;
  left: 50%;
  z-index: 999;
  transform: translateX(-50%);
  background: ${(props) =>
    props.colors ? props.colors.gradient : "rgba(0, 0, 0, 0.9)"};
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-line;
  pointer-events: none;
  z-index: 100;
  box-shadow: ${(props) =>
    props.colors ? props.colors.shadow : "0 4px 6px rgba(0, 0, 0, 0.1)"};
  border: 2px solid
    ${(props) =>
      props.colors ? props.colors.border : "rgba(255, 255, 255, 0.1)"};
  min-width: 200px;
  text-align: center;

  &:after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid
      ${(props) => (props.colors ? props.colors.border : "rgba(0, 0, 0, 0.9)")};
  }

  .tooltip-title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
    color: ${(props) => (props.colors ? props.colors.bg : "white")};
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

const BoardSquare = ({
  square,
  position,
  angle,
  width,
  height,
  backgroundImage,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { name, type, group, price } = square;
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
    visible: { opacity: 1, y: 0 },
  };

  const squareVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <SquareWrapper
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`,
      }}
      width={width}
      height={height}
      backgroundImage={backgroundImage}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      variants={squareVariants}
    >
      <SquareContent>
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
                {square.type === "land" && (
                  <>
                    Giá: 100 xu
                    <br />
                    Có thể xây dựng nhà, khách sạn
                    <br />
                    Thu tiền thuê khi người khác dừng chân
                  </>
                )}
                {square.type === "water" && (
                  <>
                    Không thể xây dựng
                    <br />
                    Phải trả phí qua lại
                    <br />
                    Phí tăng theo số ô nước sở hữu
                  </>
                )}
                {square.type === "special" && (
                  <>
                    Sự kiện đặc biệt
                    <br />
                    Có thể nhận thưởng hoặc phạt
                    <br />
                    Kích hoạt hiệu ứng đặc biệt
                  </>
                )}
                {square.type === "corner" && (
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

        {/* Thanh màu chỉ hiển thị cho ô đất */}
        {type === "land" && <ColorStripe color="red" />}
        {type === "water" && <ColorStripe color="blue" />}
        {type === "special" && <ColorStripe color="pink" />}
        {type === "corner" && <ColorStripe color="green" />}

        {/* Không còn icon */}

        <SquareName hasColorStripe={type === "land"}>{name}</SquareName>

        {price > 0 && <SquarePrice>{price}đ</SquarePrice>}
      </SquareContent>
    </SquareWrapper>
  );
};

export default BoardSquare;
