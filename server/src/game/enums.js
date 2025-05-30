// server/src/game/enums.js (Tùy chọn, để quản lý hằng số tập trung)
const GAME_PHASES = {
    INITIALIZING: 'INITIALIZING',
    PLAYER_TURN_START: 'PLAYER_TURN_START',
    WAITING_FOR_ROLL: 'WAITING_FOR_ROLL',
    PLAYER_ACTION: 'PLAYER_ACTION', // Sau khi di chuyển, chờ hành động trên ô
    TURN_DECISION: 'TURN_DECISION', // Chờ người chơi quyết định (mua, xây, ...)
    TURN_ENDING: 'TURN_ENDING',
    GAME_OVER: 'GAME_OVER',
  };
  
  const SQUARE_TYPES = {
    START: 'START',
    PROPERTY_LAND: 'PROPERTY_LAND',
    EVENT_CHANCE: 'EVENT_CHANCE', // Cơ Hội
    EVENT_FATE: 'EVENT_FATE',     // Vận Mệnh
    TAX_PAYMENT: 'TAX_PAYMENT',
    JAIL: 'JAIL',
    GO_TO_JAIL: 'GO_TO_JAIL',
    FREE_PARKING: 'FREE_PARKING', // Nơi an toàn / Miễn Phí Đỗ Xe
    SPECIAL_ACTION_HORSE: 'SPECIAL_ACTION_HORSE', // Ngựa Ô
    SPECIAL_ACTION_FESTIVAL: 'SPECIAL_ACTION_FESTIVAL', // Lễ Hội
  };
  
  const CARD_TYPES = {
    EVENT_OPPORTUNITY: 'EVENT_OPPORTUNITY',
    EVENT_FATE: 'EVENT_FATE',
    HISTORICAL_CHARACTER: 'HISTORICAL_CHARACTER',
  };
  
  const BUILDING_TYPES = {
    DEN: 'DEN', // Đền
    THANH: 'THANH', // Thành
    NHA: 'NHA', // Nhà
    // Nâng cấp
    CHUA: 'CHUA', // Chùa (nâng cấp từ Đền)
    KHU_QUAN_SU: 'KHU_QUAN_SU', // Khu Quân Sự (nâng cấp từ Thành)
    LANG: 'LANG', // Làng (nâng cấp từ Nhà)
  };
  
  
  module.exports = {
    GAME_PHASES,
    SQUARE_TYPES,
    CARD_TYPES,
    BUILDING_TYPES
  };