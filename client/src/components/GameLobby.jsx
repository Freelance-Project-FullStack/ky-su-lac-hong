import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`;

const RoomList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const RoomCard = styled(motion.div)`
  background: rgba(15, 52, 96, 0.8);
  border-radius: 12px;
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  
  &:hover {
    background: rgba(233, 69, 96, 0.8);
  }
`;

const RoomInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const RoomName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const PlayerCount = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const CreateRoomButton = styled(motion.button)`
  background: #e94560;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #d63851;
  }
`;

const GameLobby = () => {
  const [rooms, setRooms] = useState([]);
  const { handleGetRooms } = useApi();
  const { handleJoinRoom } = useSocket();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await handleGetRooms();
        setRooms(response.rooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [handleGetRooms]);

  const handleRoomClick = async (roomId) => {
    try {
      await handleJoinRoom(roomId);
      // TODO: Navigate to game room
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <LobbyContainer>
      <CreateRoomButton
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {/* TODO: Open create room modal */}}
      >
        Tạo phòng mới
      </CreateRoomButton>

      <RoomList>
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoomClick(room.id)}
          >
            <RoomInfo>
              <RoomName>{room.name}</RoomName>
              <PlayerCount>
                {room.playerCount}/{room.maxPlayers}
              </PlayerCount>
            </RoomInfo>
            <div>Chủ phòng: {room.host}</div>
            {room.hasPassword && <div>🔒 Phòng có mật khẩu</div>}
          </RoomCard>
        ))}
      </RoomList>
    </LobbyContainer>
  );
};

export default GameLobby;
