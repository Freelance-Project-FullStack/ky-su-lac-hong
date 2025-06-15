// MongoDB initialization script
// Switch to admin database to create user
db = db.getSiblingDB('admin');

// Create application user
db.createUser({
  user: "gameuser",
  pwd: "gamepass123",
  roles: [
    { role: "readWrite", db: "ky_su_lac_hong" },
    { role: "dbAdmin", db: "ky_su_lac_hong" }
  ]
});

// Switch to application database
db = db.getSiblingDB('ky_su_lac_hong');

// Create collections
db.createCollection('users');
db.createCollection('games');
db.createCollection('game_histories');

// Create indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.games.createIndex({ "roomId": 1 }, { unique: true });
db.games.createIndex({ "status": 1 });
db.games.createIndex({ "createdAt": 1 });
db.game_histories.createIndex({ "gameId": 1 });
db.game_histories.createIndex({ "playerId": 1 });

// Insert sample data
db.users.insertMany([
  {
    _id: ObjectId(),
    username: "player1",
    email: "player1@example.com",
    password: "$2b$10$example.hash.here", // bcrypt hash
    avatar: "default_avatar_1.png",
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      totalMoney: 0,
      favoriteCharacter: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    username: "player2", 
    email: "player2@example.com",
    password: "$2b$10$example.hash.here",
    avatar: "default_avatar_2.png",
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      totalMoney: 0,
      favoriteCharacter: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully!');
