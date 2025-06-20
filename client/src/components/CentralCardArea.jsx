import React from "react";
import styled, { keyframes } from "styled-components";

// Keyframes cho hiệu ứng tỏa sáng nhẹ
const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 15px 5px rgba(255, 223, 150, 0.3);
  }
  50% {
    box-shadow: 0 0 25px 10px rgba(255, 223, 150, 0.5);
  }
  100% {
    box-shadow: 0 0 15px 5px rgba(255, 223, 150, 0.3);
  }
`;

const CentralAreaContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20px; /* Khoảng cách giữa 2 ô bài */
  pointer-events: none; /* Cho phép click xuyên qua khu vực này */
`;

const CardSlot = styled.div`
  width: 200px; /* Chiều rộng của ô bài */
  height: 140px; /* Chiều cao của ô bài */
  background-image: url("/assets/images/board/parchment_bg.jpg"); /* Ảnh nền giấy da */
  background-size: cover;
  background-position: center;
  border: 3px solid #856d4b;
  border-radius: 10px;
  box-shadow: 0 0 15px 5px rgba(255, 223, 150, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  pointer-events: auto; /* Cho phép click vào chính ô bài */
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.05) translateY(-5px);
    box-shadow: 0 0 25px 10px rgba(255, 223, 150, 0.6);
  }

  /* Áp dụng animation */
  animation: ${pulseGlow} 5s infinite ease-in-out;
`;

const QuestionMark = styled.span`
  font-family: "serif";
  font-size: 80px;
  font-weight: bold;
  color: #5a3a22;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
`;

const CentralCardArea = () => {
  const handleCardClick = (type) => {
    console.log(`Rút thẻ: ${type}`);
    // Thêm logic xử lý rút thẻ ở đây
  };

  return (
    <CentralAreaContainer>
      <CardSlot onClick={() => handleCardClick("Sự Kiện")}>
        <QuestionMark>?</QuestionMark>
      </CardSlot>
      <CardSlot onClick={() => handleCardClick("Khí Vận")}>
        <QuestionMark>?</QuestionMark>
      </CardSlot>
    </CentralAreaContainer>
  );
};

export default CentralCardArea;
