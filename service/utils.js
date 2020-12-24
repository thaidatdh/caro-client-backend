const configs = require('../configs');
const boardSize = 20;
const RANGE = 20;
const roomStatus = {
  waiting: 'Waiting',
  playing: 'Playing'
}

const createEmptyBoard = () => {
  return {
    turn: 0,
    col: 0,
    row: 0,
    total: 0,
    squares: Array(boardSize * boardSize).fill(null),
    moves: [],
  };
}

const calculateWinner = (player, row, col, squares) => {
    row--;
    col--;
    let count = 0,
      k = row,
      h;
    let head = 0;
    // check col
  
    //count top-down
    while (k <= RANGE - 1 && squares[k * boardSize + col] === squares[row * boardSize + col]) {
      count++;
      k++;
    }
  
    //check head top-down
    if (
      (k <= RANGE - 1 && squares[k * boardSize + col] === player) ||
      (k <= RANGE - 2 && squares[(k + 1) * boardSize + col] === player)
    ) {
      head++;
    }
  
    k = row - 1;
  
    //count bottom-up
    while (k >= 0 && squares[k * boardSize + col] === squares[row * boardSize + col]) {
      count++;
      k--;
    }
    //check head bottom up
    if (
      (k >= 0 && squares[k * boardSize + col] === player) ||
      (k >= 1 && squares[(k - 1) * boardSize + col] === player)
    ) {
      head++;
    }
  
    if (count === 5 && head !== 2) return true;
  
    head = 0;
    count = 0;
    h = col;
    // check row
    //count left-right
    while (h <= RANGE - 1 && squares[row * boardSize + h] === squares[row * boardSize + col]) {
      count++;
      h++;
    }
  
    if (
      (h <= RANGE - 1 && squares[row * boardSize + h] === player) ||
      (h <= RANGE - 2 && squares[row * boardSize + h + 1] === player)
    ) {
      head++;
    }
  
    h = col - 1;
    //count right-left
    while (h >= 0 && squares[row * boardSize + h] === squares[row * boardSize + col]) {
      count++;
      h--;
    }
  
    if (
      (h >= 0 && squares[row * boardSize + h] === player) ||
      (h >= 1 && squares[row * boardSize + h - 1] === player)
    ) {
      head++;
    }
  
    if (count === 5 && head !== 2) return true;
  
    //check diagonal 1
    head = 0;
    h = row;
    k = col;
    count = 0;
    //count diagonal left-right top-down
    while (
      h <= RANGE - 1 &&
      k <= RANGE - 1 &&
      squares[row * boardSize + col] === squares[h * boardSize + k]
    ) {
      count++;
      h++;
      k++;
    }
    //check head left-right top-down
    if (
      (h <= RANGE - 1 && k <= RANGE - 1 && squares[h * boardSize + k] === player) ||
      (h <= RANGE - 2 && k <= RANGE - 2 && squares[(h + 1) * boardSize + k + 1] === player)
    ) {
      head++;
    }
  
    h = row - 1;
    k = col - 1;
    //count diagonal right-left bottom-up
    while (h >= 0 && k >= 0 && squares[row * boardSize + col] === squares[h * boardSize + k]) {
      count++;
      h--;
      k--;
    }
    //check head right-left bottom-up
    if (
      (h >= 0 && k >= 0 && squares[h * boardSize + k] === player) ||
      (h >= 1 && k >= 1 && squares[(h - 1) * boardSize + k - 1] === player)
    ) {
      head++;
    }
  
    if (count === 5 && head !== 2) return true;
  
    //check diagonal 2
    h = row;
    k = col;
    count = 0;
    head = 0;
    //count right-left up-down
    while (
      h <= RANGE - 1 &&
      k >= 0 - 1 &&
      squares[row * boardSize + col] === squares[h * boardSize + k]
    ) {
      count++;
      h++;
      k--;
    }
    //check head right-left up-down
    if (
      (h <= RANGE - 1 && k >= 0 && squares[h * boardSize + k] === player) ||
      (h <= RANGE - 2 && k >= 1 && squares[(h + 1) * boardSize + k + 1] === player)
    ) {
      head++;
    }
  
    h = row - 1;
    k = col + 1;
    //count left-right bottom-up
    while (h >= 0 && squares[row * boardSize + col] === squares[h * boardSize + k]) {
      count++;
      h--;
      k++;
    }
    if (
      (h >= 0 && k <= RANGE - 1 && squares[h * boardSize + k] === player) ||
      (h >= 1 && h <= RANGE - 2 && squares[(h - 1) * boardSize + k - 1] === player)
    ) {
      head++;
    }
  
    if (count === 5 && head !== 2) return true;
  
    return false;
  };

const evaluateRank = (win, lose, draw) => {
  return win >= 300
    ? configs.rank.data[3]
    : win >= 200
    ? configs.rank.data[2]
    : win >= 100
    ? configs.rank.data[1]
    : configs.rank.data[0];
}
module.exports = {
    boardSize,
    createEmptyBoard,
    calculateWinner,
    evaluateRank,
    roomStatus
}