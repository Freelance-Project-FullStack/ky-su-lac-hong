import { useEffect, useCallback } from 'react';
import socketService from '../services/SocketService';

export const useSocket = () => {
  useEffect(() => {
    // Kết nối socket khi component mount
    socketService.connect();

    // Cleanup khi unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Các hàm xử lý game actions
  const handleRollDice = useCallback(() => {
    socketService.rollDice();
  }, []);

  const handlePurchaseDecision = useCallback((squareId, purchase) => {
    socketService.sendPurchaseDecision(squareId, purchase);
  }, []);

  const handleBuildDecision = useCallback((squareId, buildingType) => {
    socketService.sendBuildDecision(squareId, buildingType);
  }, []);

  const handleJailDecision = useCallback((decision) => {
    socketService.sendJailDecision(decision);
  }, []);

  const handleEndTurn = useCallback(() => {
    socketService.sendEndTurn();
  }, []);

  const handleUseHistoricalCard = useCallback(() => {
    socketService.sendUseHistoricalCard();
  }, []);

  const handleProposeAlliance = useCallback((targetPlayerId) => {
    socketService.sendProposeAlliance(targetPlayerId);
  }, []);

  const handleAllianceResponse = useCallback((proposingPlayerId, accepted) => {
    socketService.sendAllianceResponse(proposingPlayerId, accepted);
  }, []);

  const handleHorseMove = useCallback((targetSquareId) => {
    socketService.sendSpecialActionHorseMove(targetSquareId);
  }, []);

  const handleFestival = useCallback((districtSquareId) => {
    socketService.sendSpecialActionFestival(districtSquareId);
  }, []);

  const handleChatMessage = useCallback((message) => {
    socketService.sendChatMessage(message);
  }, []);

  const handlePaymentDecision = useCallback((decision, data) => {
    socketService.sendPaymentDecision(decision, data);
  }, []);

  // Các hàm xử lý room actions
  const handleCreateRoom = useCallback((playerName) => {
    socketService.createRoom(playerName);
  }, []);

  const handleJoinRoom = useCallback((roomId, playerName) => {
    socketService.joinRoom(roomId, playerName);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    socketService.leaveRoom();
  }, []);

  const handleStartGame = useCallback(() => {
    socketService.startGame();
  }, []);

  const handleCloseRoom = useCallback(() => {
    socketService.closeRoom();
  }, []);

  const handleUpdateRoomSettings = useCallback((settings) => {
    socketService.updateRoomSettings(settings);
  }, []);

  return {
    // Game actions
    handleRollDice,
    handlePurchaseDecision,
    handleBuildDecision,
    handleJailDecision,
    handleEndTurn,
    handleUseHistoricalCard,
    handleProposeAlliance,
    handleAllianceResponse,
    handleHorseMove,
    handleFestival,
    handleChatMessage,
    handlePaymentDecision,

    // Room actions
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleStartGame,
    handleCloseRoom,
    handleUpdateRoomSettings,
  };
};
