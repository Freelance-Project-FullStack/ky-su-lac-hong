import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import GameBoard from "./GameBoard.jsx";

const RoomContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const SidePanel = styled.div`
  background: rgba(15, 52, 96, 0.8);
  padding: 1.5rem;
  color: white;
  display: flex;
  flex-direction: column;
`;

const PlayerList = styled.div`
  margin-bottom: 2rem;
`;

const PlayerCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => props.color || "#e94560"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-weight: bold;
`;

const PlayerStats = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ChatBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
`;

const ChatMessage = styled.div`
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const ChatInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  padding: 0.8rem;
  color: white;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ActionButton = styled(motion.button)`
  background: #e94560;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 4px;
  margin-top: 1rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GameRoom = () => {
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [gameState, setGameState] = useState(null);

  const {
    handleStartGame,
    handleEndTurn,
    handleRollDice,
    handleChatMessage,
    handleLeaveRoom,
  } = useSocket();

  useEffect(() => {
    // Subscribe to socket events
    const socket = window.socket;

    // Kiểm tra socket đã được khởi tạo chưa
    if (!socket) {
      console.error("Socket chưa được khởi tạo khi vào GameRoom");
      return;
    }

    socket.on("playerJoined", (data) => {
      setPlayers(data.players);
    });

    socket.on("playerLeft", (data) => {
      setPlayers(data.players);
    });

    socket.on("gameStateUpdate", (state) => {
      setGameState(state);
    });

    socket.on("chatMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      // Kiểm tra socket vẫn tồn tại khi cleanup
      if (socket) {
        socket.off("playerJoined");
        socket.off("playerLeft");
        socket.off("gameStateUpdate");
        socket.off("chatMessage");
      }
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      handleChatMessage(chatInput);
      setChatInput("");
    }
  };

  return (
    <RoomContainer>
      <GameContainer>
        <GameBoard gameState={gameState} />
      </GameContainer>

      <SidePanel>
        <PlayerList>
          {players.map((player) => (
            <PlayerCard key={player.id} whileHover={{ scale: 1.02 }}>
              <PlayerAvatar color={player.color}>
                {player.name[0].toUpperCase()}
              </PlayerAvatar>
              <PlayerInfo>
                <PlayerName>{player.name}</PlayerName>
                <PlayerStats>
                  Tiền: {player.money} | Tài sản: {player.properties}
                </PlayerStats>
              </PlayerInfo>
            </PlayerCard>
          ))}
        </PlayerList>

        <ChatBox>
          <ChatMessages>
            {messages.map((msg, index) => (
              <ChatMessage key={index}>
                <strong>{msg.player}:</strong> {msg.text}
              </ChatMessage>
            ))}
          </ChatMessages>

          <form onSubmit={sendMessage}>
            <ChatInput
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
          </form>
        </ChatBox>

        {gameState?.isHost && !gameState?.gameStarted && (
          <ActionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
          >
            Bắt đầu trò chơi
          </ActionButton>
        )}

        {gameState?.gameStarted &&
          gameState?.currentPlayer === gameState?.playerId && (
            <>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRollDice}
                disabled={gameState?.hasRolled}
              >
                Tung xúc xắc
              </ActionButton>

              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEndTurn}
                disabled={!gameState?.canEndTurn}
              >
                Kết thúc lượt
              </ActionButton>
            </>
          )}

        <ActionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLeaveRoom}
          style={{ marginTop: "auto", background: "#0f3460" }}
        >
          Rời phòng
        </ActionButton>
      </SidePanel>
    </RoomContainer>
  );
};

export default GameRoom;
