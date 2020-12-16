const utils = require('./utils.js');

//queue
let userWaiting = [];
let rooms = [];
let userPlaying = [];
let interval;
const boardSize = utils.boardSize;

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
      // Leave global room
      userWaiting = userWaiting.filter((user) => user.username != value.creator.username);
      socket.leave("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
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
      // Leave global room
      userWaiting = userWaiting.filter((user) => user.username != value.player.username);
      socket.leave("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
      let room;
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          rooms[i].num++;
          rooms[i].players.push(value.player);
          room = rooms[i];
          break;
        }
      }
      io.to(value.roomID).emit("Second-Player", value.player);
      socket.join(value.roomID);
      console.log(userWaiting.filter((e) => e.id === value.roomID));
      socket.emit(
        "First-Player",
        room.players[0]
      );
      // Board
      room.board.turn = room.players[0].username;
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
        const winner = utils.calculateWinner(currentPlayer, board.row, board.col, board.squares);
        if (winner){
          io.to(value.roomID).emit("Declare-Winner-Response", currentPlayer);
        } else {
          board.turn = room.players[board.total % 2].username;
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

      // Join global room
      userWaiting.push(value.player);
      socket.join("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
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

