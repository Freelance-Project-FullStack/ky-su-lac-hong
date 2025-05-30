// server/src/utils/helpers.js
const _ = require('lodash');

function shuffleArray(array) {
  return _.shuffle(array);
}

function rollSingleDice() {
  return Math.floor(Math.random() * 6) + 1;
}

module.exports = {
  shuffleArray,
  rollSingleDice,
};