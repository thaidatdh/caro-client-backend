const utils = require("./utils.js");

//queue
// Trong waiting line là userID,  trong board.players là _id //
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
    socket.join(socket.id);

    //ADD USER TO GLOBAL ROOM
    socket.on("Global-Room", (value) => {
      if (!userWaiting.find((user) => user._id == value.userID)) {
        userWaiting.push({
          id: socket.id,
          _id: value.userID,
          username: value.username,
        });
      }
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
      userWaiting = userWaiting.filter((user) => user._id != value.creator._id);
      socket.leave("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);

      let newRoomID = value.creator._id;
      if (rooms.find((room) => room.roomID === newRoomID)) {
        const firstChar = newRoomID.charCodeAt(0);
        newRoomID = newRoomID.slice(1);
        newROomID = String.fromCharCode(firstChar + 1).concat(newRoomID);
      }
      socket.join(`${newRoomID}`);
      console.log(`Room ${newRoomID} created`);
      const newRoom = {
        roomID: newRoomID,
        creator: {...value.creator, id: socket.id},
        title: value.title,
        num: 1,
        status: utils.roomStatus.waiting,
        players: [{ ...value.creator, id: socket.id, isReady: false }],
        spectators: [],
        chats: [],
        moves: [],
        // Create Board: no one's turn yet
        //board: utils.createEmptyBoard(),
      };
      rooms.push(newRoom);
      io.to(`${newRoomID}`).emit("Room-Owner-Response", value.creator._id);
      io.to("Global-Room").emit("Playing-Room", rooms);
    });

    //LOG OUT
    socket.on("Log-Out", (value) => {
      const temp = userWaiting.filter((e) => {
        return e._id != value.userID;
      });
      userWaiting = temp;
      socket.leave("Global-Room");
      rooms.forEach((e) => {
        console.log("Room: " + e.roomID);
        io.to(e.roomID).emit("Global-Users", userWaiting);
      });
      io.to("Global-Room").emit("Global-Users", userWaiting);
    });

    //JOIN ROOM
    socket.on("Join-Room", (value) => {
      // Leave global room
      userWaiting = userWaiting.filter((user) => user._id != value.player._id);
      socket.leave("Global-Room");
      io.to(value.roomID).emit("Global-Users", userWaiting);

      const room = rooms.find((room) => room.roomID === value.roomID);
      room.num = room.num + 1;
      room.players.push({ ...value.player, id: socket.id });

      socket.to(value.roomID).emit("Second-Player", value.player);
      socket.join(value.roomID);
      console.log(userWaiting.filter((e) => e.id === value.roomID));
      socket.emit("First-Player", room.players[0]);
      // Board
      //room.board.turn = room.players[0]._id;
      io.to(`${value.roomID}`).emit("Room-Owner", room.creator._id);
      
    });

    // READY GAME
    socket.on('Ready-Game', (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      if (room){
        // Player 1 Ready
        if (room.players[0]._id === value._id){
          room.players[0].isReady = true;
        }
        // Player 2 Ready
        else if (room.players[1]._id === value._id){
          room.players[1].isReady = true;
        }
        // Notify to everyone the player has been ready
        socket.to(`${value.roomID}`).emit("Ready-Game-Response", value._id);

        // Game start when two players are ready
        if (room.players[0].isReady && room.players[1].isReady){
          room.board = utils.createEmptyBoard();
          room.board.turn = room.players[0]._id;
          room.status = utils.roomStatus.playing;
          io.to(value.roomID).emit("Board-Response", room.board);
          io.to("Global-Room").emit("Playing-Room", rooms);
        }
      }
    })

    // RESTART GAME
    /*socket.on('Restart-Game', (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      if (room){
        // Player 1 Ready
        if (room.players[0]._id === value._id){
          room.players[0].isReady = true;
        }
        // Player 2 Ready
        else if (room.players[1]._id === value._id){
          room.players[1].isReady = true;
        }
        // Notify to everyone the player has been ready
        socket.to(`${value.roomID}`).emit("Ready-Game-Response", value._id);

        // Game start when two players are ready
        if (room.players[0].isReady && room.players[1].isReady){
          room.board = utils.createEmptyBoard();
          room.board.turn = room.players[0]._id;
          room.status = utils.roomStatus.playing;
          io.to(value.roomID).emit("Restart-Game-Response", room.board);
          io.to("Global-Room").emit("Playing-Room", rooms);
        }
      }
    })*/

    // MAKE A MOVE
    socket.on("Make-a-move", (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      if (room) {
        const board = room.board;
        const currentPlayer = board.total % 2 == 0 ? "X" : "O";
        board.row = value.boardProp.row;
        board.col = value.boardProp.col;
        board.squares[value.boardProp.idx] = currentPlayer;
        board.total = board.total + 1;
        const winner = utils.calculateWinner(
          currentPlayer,
          board.row,
          board.col,
          board.squares
        );
        if (winner) {
          room.board.turn = 0;
          room.status = utils.roomStatus.waiting;
          if (room.players[0]) {
            room.players[0].isReady = false;
          }
          if (room.players[1]) {
            room.players[1].isReady = false;
          }
          io.to("Global-Room").emit("Playing-Room", rooms);
          io.to(value.roomID).emit("Declare-Winner-Response", currentPlayer);
        } else {
          board.turn = room.players[board.total % 2]._id;
        }
        io.to(value.roomID).emit("Board-Response", room.board);
      }
    });

    // WITHDRAW
    socket.on("Withdraw", (value) => {
      const room = rooms.find((room) => room.roomID = value.roomID);
      if (room){
        room.board.turn = 0;
        room.status = utils.roomStatus.waiting;
        if (room.players[0]) {
          room.players[0].isReady = false;
        }
        if (room.players[1]) {
          room.players[1].isReady = false;
        }
        io.to("Global-Room").emit("Playing-Room", rooms);
        io.to(value.roomID).emit("Declare-Winner-Response", (value.player._id === room.players[0]._id)? 'O' : 'X');
      }
    })

    //LEAVE ROOM
    socket.on("Leave-Room", (value) => {
      const temp = [];
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          // Room owner out => close room
          if (value.player._id === rooms[i].creator._id) {
            socket.to(`${rooms[i].roomID}`).emit("Close-Room", rooms[i].roomID);
          } else {
            rooms[i].num--;
            rooms[i].players = rooms[i].players.filter(
              (player) => player._id != value.player._id
            );
            temp.push(rooms[i]);
            socket
              .to(`${rooms[i].roomID}`)
              .emit("Leave-Room-Player", { player: socket.id });
          }

          // Declare winner
          rooms[i].board.turn = 0;
          rooms[i].status = utils.roomStatus.waiting;
          let winner = "";
          if (rooms[i].players[0]) {
            rooms[i].players[0].isReady = false;
            winner = 'X';
          }
          if (rooms[i].players[1]) {
            rooms[i].players[1].isReady = false;
            winner = 'O';
          }
          io.to(value.roomID).emit("Declare-Winner-Response", winner);
        } else {
          temp.push(rooms[i]);
        }
      }
      rooms = temp;
      io.to("Global-Room").emit("Playing-Room", rooms);
      // Join global room
      userWaiting.push({
        id: socket.id,
        _id: value.player._id,
        username: value.player.username,
      });
      //socket.to(`${value.roomID}`).emit("Global-Users", userWaiting);
      socket.leave(`${value.roomID}`);
      socket.join("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
    });

    //INVATE USER
    socket.on("Invite-Room", (value) => {
      io.to(value.socketID).emit("Invite-Room-Response", value.room);
    });

    //ROOM CHAT
    socket.on("Private-Room-Chat", (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      room.chats.push(value.msg);
      socket.to(value.roomID).emit("Private-Room-Chat-Response", room.chats);
    });

    //WHEN DISCONNECT
    socket.on("disconnect", () => {
      const temp1 = userWaiting.filter((e) => e.id !== socket.id);
      const isUserInRoom = (temp1.length === userWaiting.length);

      // User in Global Room
      if (!isUserInRoom){
        userWaiting = temp1;
        io.to("Global-Room").emit("Global-Users", userWaiting);
      } 
      // User in Private Room
      else {
        const temp = [];
        for (var i = 0; i < rooms.length; i++) {
          if ((rooms[i].players[0] && rooms[i].players[0].id === socket.id) ||
              (rooms[i].players[1] && rooms[i].players[1].id === socket.id)) {
            // Room owner out => close room
            if (socket.id === rooms[i].creator.id) {
              socket.to(`${rooms[i].roomID}`).emit("Close-Room", rooms[i].roomID);
              io.to("Global-Room").emit("Playing-Room", rooms);
            } else {
              rooms[i].num--;
              rooms[i].players = rooms[i].players.filter(
                (player) => player.id != socket.id
              );
              temp.push(rooms[i]);
              socket
                .to(`${rooms[i].roomID}`)
                .emit("Leave-Room-Player", { player: socket.id });
            }

            // Declare winner
            rooms[i].board.turn = 0;
            rooms[i].status = utils.roomStatus.waiting;
            let winner = "";
            if (rooms[i].players[0]) {
              rooms[i].players[0].isReady = false;
              winner = 'X';
            }
            if (rooms[i].players[1]) {
              rooms[i].players[1].isReady = false;
              winner = 'O';
            }
            io.to(`${rooms[i].roomID}`).emit("Declare-Winner-Response", winner);
          } else {
            temp.push(rooms[i]);
          }
        }
        rooms = temp;
        io.to("Global-Room").emit("Playing-Room", rooms);
      }
      console.log("disconnect: " + socket.id);
    });
  });
};
