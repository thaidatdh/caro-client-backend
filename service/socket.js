//queue
let userWaiting = [];
let rooms = [];
let userPlaying = [];
let interval;
const boardSize = 15;
const RANGE = 15;

const calculateWinner = (player, row, col, squares) => {
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

/**Connection**/
exports.socketService = (io) => {
  io.on("connection", (socket) => {
    console.log("New client: " + socket.id);
    socket.emit("id", socket.id);

    //ADD USER TO GLOBAL ROOM
    socket.on("Global-Room", (value) => {
      userWaiting.push({ id: socket.id, username: value.username });
      socket.join("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
      // Overkill
      io.to("Global-Room").emit("Playing-Room", rooms);
    });

    //CHAT ALL IN GLOBAL ROOM
    socket.on("Global-Chat", (value) => {
      //value = {username: string,msg:string}
      io.to("Global-Room").emit("Global-Chat-Response", value);
    });

    //CREATE NEW ROOM
    socket.on("Create", (value) => {
      socket.join(`${socket.id}`);
      console.log("Room created");
      const newRoom = {
        roomID: socket.id,
        creator: value.creator,
        title: value.title,
        num: 1,
        players: [value.creator],
        // Create Board: no one's turn yet
        board: {
          turn: -1,
          col: 0,
          row: 0,
          total: 0,
          squares: Array(boardSize * boardSize).fill(null),
        }
      }
      rooms.push(newRoom);
      io.to(`${socket.id}`).emit("Board-Response", newRoom.board);
      io.to("Global-Room").emit("Playing-Room", rooms);
    });

    //LOG OUT
    socket.on("Log-Out", (value) => {
      const temp = userWaiting.filter((e) => e.id !== socket.id);
      userWaiting = temp;
      socket.leave("Global-Room");
    });

    //JOIN ROOM
    socket.on("Join-Room", (value) => {
      let room;
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          rooms[i].num++;
          rooms[i].players.push(value.player.username);
          room = rooms[i];
          break;
        }
      }
      io.to(value.roomID).emit("Second-Player", value.player);
      socket.join(value.roomID);
      console.log(userWaiting.filter((e) => e.id === value.roomID));
      socket.emit(
        "First-Player",
        userWaiting.filter((e) => e.id === value.roomID)[0]
      );
      // Board
      room.board.turn = room.players[0];
      io.to(value.roomID).emit("Board-Response", room.board);
    });

    // MAKE A MOVE
    socket.on("Make-a-move", (value) => {
      let room;
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          room = rooms[i];
          break;
        }
      }
      if (room){
        const board = room.board;
        const currentPlayer = (board.total % 2 == 0)? 'X' : 'O';;
        board.row = value.boardProp.row;
        board.col = value.boardProp.col;
        board.squares[value.boardProp.idx] = currentPlayer;
        board.total = board.total + 1;
        const winner = calculateWinner(currentPlayer, board.row, board.col, board.squares);
        if (winner){
          io.to(value.roomID).emit("Declare-Winner-Response", currentPlayer);
        } else {
          board.turn = room.players[board.total % 2];
        }
        io.to(value.roomID).emit("Board-Response", room.board);
      }
    })

    //LEAVE ROOM
    socket.on("Leave-Room", (value) => {
      const temp = [];
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          socket.leave(`${rooms[i].roomID}`);
          socket.to(`${rooms[i].roomID}`).emit("Leave-Room-Player", socket.id);
          if (rooms[i].num > 1) {
            rooms[i].num--;
            rooms[i].players = rooms[i].players.filter((player) => player.username != value.player.username)
            temp.push(rooms[i]);
          }
        } else {
          temp.push(rooms[i]);
        }
      }
      rooms = temp;
      io.to("Global-Room").emit("Playing-Room", rooms);
    });

    //ROOM CHAT
    socket.on("Private-Room-Chat", (value) => {
      io.to(value.roomID).emit("Private-Room-Chat-Response", value.msg);
    });

    //WHEN DISCONNECT
    socket.on("disconnect", () => {
      const temp = userWaiting.filter((e) => e.id !== socket.id);
      userWaiting = temp;
      console.log("disconnect: " + socket.id);
      io.to("Global-Room").emit("Global-Users", userWaiting);
    });
  });
};

