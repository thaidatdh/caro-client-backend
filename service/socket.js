const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const User = require("../models/userModel");
const Game = require("../models/gameModel");
const Move = require("../models/moveModel");
const Chat = require("../models/chatModel");
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
  io.on("connection", async (socket) => {
    console.log("New client: " + socket.id);
    socket.emit("id", socket.id);
    socket.join(socket.id);
    //Game.deleteAll();
    //Move.deleteAll();
    //Chat.deleteAll();
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
      notifyRoomOwnersGlobalUsers(io);
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
      notifyRoomOwnersGlobalUsers(io);

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
        creator: { ...value.creator, id: socket.id },
        title: value.title,
        num: 1,
        status: utils.roomStatus.waiting,
        players: [{ ...value.creator, id: socket.id, isReady: false }],
        spectators: [],
        chats: [], // Chats will not be saved
        password: value.password,
        time: value.time,
        // Create Board: no one's turn yet
        //board: utils.createEmptyBoard(),
      };
      rooms.push(newRoom);
      io.to(`${newRoomID}`).emit("Room-Owner-Response", value.creator._id);
      io.to("Global-Room").emit("Playing-Room", rooms);
    });

    //LOG OUT
    socket.on("Log-Out", async (value) => {
      const temp1 = userWaiting.filter((e) => e.id !== socket.id);
      const isUserInRoom = temp1.length === userWaiting.length;

      // User in Global Room
      if (!isUserInRoom) {
        userWaiting = temp1;
        io.to("Global-Room").emit("Global-Users", userWaiting);
        notifyRoomOwnersGlobalUsers(io);
      }
      // User in Private Room
      else {
        const temp = [];
        for (var i = 0; i < rooms.length; i++) {
          if (
            (rooms[i].players[0] && rooms[i].players[0].id === socket.id) ||
            (rooms[i].players[1] && rooms[i].players[1].id === socket.id)
          ) {
            // Declare winner
            if (
              rooms[i].board &&
              rooms[i].board.squares.length > 0 &&
              !rooms[i].board.winner
            ) {
              rooms[i].board.turn = 0;
              rooms[i].status = utils.roomStatus.waiting;
              let winner = "";
              let toPlayer1 = false;
              let toPlayer2 = false;
              if (rooms[i].players[0].id !== socket.id) {
                rooms[i].players[0].isReady = false;
                winner = "X";
                toPlayer1 = true;
              }
              if (rooms[i].players[1].id !== socket.id) {
                rooms[i].players[1].isReady = false;
                winner = "O";
                toPlayer2 = true;
              }
              rooms[i].board.winner = winner;
              io.to(`${rooms[i].roomID}`).emit("Declare-Winner-Response", {
                winner: winner,
                winnerList: [0, 1, 2, 3, 4],
              });

              // Save Game
              await saveGame(io, rooms[i], winner, {
                toPlayer1: toPlayer1,
                toPlayer2: toPlayer2,
              });
            }

            // Room owner out => close room
            if (socket.id === rooms[i].creator.id) {
              socket
                .to(`${rooms[i].roomID}`)
                .emit("Close-Room", rooms[i].roomID);
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
          } else {
            temp.push(rooms[i]);
          }
        }
        rooms = temp;
        io.to("Global-Room").emit("Playing-Room", rooms);
      }
    });

    //JOIN ROOM
    socket.on("Join-Room", (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      console.log(value);
      if (room !== undefined && room.password === value.password) {
        socket.emit("Join-Room-Callback", {
          success: true,
          room: {
            roomID: room.roomID,
            time: room.time,
            password: room.password,
          },
        });
        io.to(`${value.roomID}`).emit("Notify-Quick-Play", {
          roomID: value.roomID,
          turn: 1,
        });

        room.num = room.num + 1;
        room.players.push({ ...value.player, id: socket.id });

        // Leave global room
        userWaiting = userWaiting.filter(
          (user) => user._id != value.player._id
        );
        socket.leave("Global-Room");
        io.to("Global-Room").emit("Global-Users", userWaiting);
        notifyRoomOwnersGlobalUsers(io);

        socket.to(value.roomID).emit("Second-Player", value.player);
        socket.join(value.roomID);
        console.log(userWaiting.filter((e) => e.id === value.roomID));
        socket.emit("First-Player", room.players[0]);

        io.to(socket.id).emit("Private-Room-Chat-Response", room.chats);
        // Board
        //room.board.turn = room.players[0]._id;
        io.to(`${value.roomID}`).emit("Room-Owner", room.creator._id);
      } else {
        socket.emit("Join-Room-Callback", {
          success: false,
        });
      }
    });

    // READY GAME
    socket.on("Ready-Game", (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      if (room) {
        // Player 1 Ready
        if (room.players[0]._id === value._id) {
          room.players[0].isReady = true;
        }
        // Player 2 Ready
        else if (room.players[1]._id === value._id) {
          room.players[1].isReady = true;
        }
        // Notify to everyone the player has been ready
        socket.to(`${value.roomID}`).emit("Ready-Game-Response", value._id);

        // Game start when two players are ready
        if (room.players[0].isReady && room.players[1].isReady) {
          room.board = utils.createEmptyBoard();
          room.board.turn = room.players[0]._id;
          room.status = utils.roomStatus.playing;
          io.to(value.roomID).emit("Board-Response", room.board);
          io.to("Global-Room").emit("Playing-Room", rooms);
        }
      }
    });

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
    socket.on("Make-a-move", async (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      if (room) {
        const board = room.board;
        const currentPlayer = board.total % 2 == 0 ? "X" : "O";
        board.row = value.boardProp.row;
        board.col = value.boardProp.col;
        board.squares[value.boardProp.idx] = currentPlayer;
        board.total = board.total + 1;
        // Add move
        board.moves.push({
          _id: value.player._id,
          number: board.total, // Based-1 index
          type: currentPlayer,
          row: value.boardProp.row,
          col: value.boardProp.col,
          time: Date.now() - board.timeStart,
        });
        const winner = utils.calculateWinner(
          currentPlayer,
          board.row,
          board.col,
          board.squares
        );
        if (winner) {
          room.board.turn = 0;
          room.status = utils.roomStatus.waiting;
          room.board.winner = currentPlayer;
          if (room.players[0]) {
            room.players[0].isReady = false;
          }
          if (room.players[1]) {
            room.players[1].isReady = false;
          }
          io.to("Global-Room").emit("Playing-Room", rooms);
          io.to(value.roomID).emit("Declare-Winner-Response", {
            winner: currentPlayer,
            winnerList: [0, 1, 2, 3, 4],
          });
          // Save Game
          saveGame(io, room, currentPlayer, {
            toPlayer1: true,
            toPlayer2: true,
          });
        }
        // Draw
        else if (board.total === board.squares.length) {
          room.board.turn = 0;
          room.status = utils.roomStatus.waiting;
          if (room.players[0]) {
            room.players[0].isReady = false;
          }
          if (room.players[1]) {
            room.players[1].isReady = false;
          }
          io.to("Global-Room").emit("Playing-Room", rooms);
          io.to(value.roomID).emit("Declare-Winner-Response", {
            winner: "None",
            winnerList: [],
          });
        } else {
          board.turn = room.players[board.total % 2]._id;
        }
        io.to(value.roomID).emit("Board-Response", room.board);
      }
    });

    // WITHDRAW
    socket.on("Withdraw", (value) => {
      const room = rooms.find((room) => (room.roomID = value.roomID));
      if (room) {
        if (room.board && room.board.squares.length > 0) {
          room.board.turn = 0;
          room.status = utils.roomStatus.waiting;
          if (room.players[0]) {
            room.players[0].isReady = false;
          }
          if (room.players[1]) {
            room.players[1].isReady = false;
          }
          io.to("Global-Room").emit("Playing-Room", rooms);
          const winner = value.player._id === room.players[0]._id ? "O" : "X";
          room.board.winner = winner;
          io.to(value.roomID).emit("Declare-Winner-Response", {
            winner: winner,
            winnerList: [0, 1, 2, 3, 4],
          });

          // Save Game
          saveGame(io, room, winner, { toPlayer1: true, toPlayer2: true });
        }
      }
    });

    //LEAVE ROOM
    socket.on("Leave-Room", async (value) => {
      const temp = [];
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          // Declare winner
          if (
            rooms[i].board &&
            rooms[i].board.squares.length > 0 &&
            !rooms[i].board.winner
          ) {
            rooms[i].board.turn = 0;
            rooms[i].status = utils.roomStatus.waiting;
            let winner = "";
            if (rooms[i].players[0].id !== socket.id) {
              rooms[i].players[0].isReady = false;
              winner = "X";
            }
            if (rooms[i].players[1].id !== socket.id) {
              rooms[i].players[1].isReady = false;
              winner = "O";
            }
            rooms[i].board.winner = winner;
            io.to(`${rooms[i].roomID}`).emit("Declare-Winner-Response", {
              winner: winner,
              winnerList: [0, 1, 2, 3, 4],
            });

            // Save Game
            await saveGame(io, rooms[i], winner, {
              toPlayer1: true,
              toPlayer2: true,
            });
          }

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
      socket.to(`${value.roomID}`).emit("Global-Users", userWaiting);
      socket.leave(`${value.roomID}`);
      socket.join("Global-Room");
      io.to("Global-Room").emit("Global-Users", userWaiting);
      notifyRoomOwnersGlobalUsers(io);
    });

    //INVATE USER
    socket.on("Invite-Room", (value) => {
      io.to(value.socketID).emit("Invite-Room-Response", value.room);
    });

    //ROOM CHAT
    socket.on("Private-Room-Chat", (value) => {
      const room = rooms.find((room) => room.roomID === value.roomID);
      // Refine chat
      if (room.board) {
        value.msg.time = value.msg.time - room.board.timeStart;
        room.board.chats.push(value.msg);
      }
      room.chats.push(value.msg);
      socket.to(value.roomID).emit("Private-Room-Chat-Response", room.chats);
    });

    //WHEN DISCONNECT
    socket.on("disconnect", async () => {
      const temp1 = userWaiting.filter((e) => e.id !== socket.id);
      const isUserInRoom = temp1.length === userWaiting.length;

      // User in Global Room
      if (!isUserInRoom) {
        userWaiting = temp1;
        io.to("Global-Room").emit("Global-Users", userWaiting);
        notifyRoomOwnersGlobalUsers(io);
      }
      // User in Private Room
      else {
        const temp = [];
        for (var i = 0; i < rooms.length; i++) {
          if (
            (rooms[i].players[0] && rooms[i].players[0].id === socket.id) ||
            (rooms[i].players[1] && rooms[i].players[1].id === socket.id)
          ) {
            // Declare winner
            if (
              rooms[i].board &&
              rooms[i].board.squares.length > 0 &&
              !rooms[i].board.winner
            ) {
              rooms[i].board.turn = 0;
              rooms[i].status = utils.roomStatus.waiting;
              let winner = "";
              let toPlayer1 = false;
              let toPlayer2 = false;
              if (rooms[i].players[0].id !== socket.id) {
                rooms[i].players[0].isReady = false;
                winner = "X";
                toPlayer1 = true;
              }
              if (rooms[i].players[1].id !== socket.id) {
                rooms[i].players[1].isReady = false;
                winner = "O";
                toPlayer2 = true;
              }
              rooms[i].board.winner = winner;
              io.to(`${rooms[i].roomID}`).emit("Declare-Winner-Response", {
                winner: winner,
                winnerList: [0, 1, 2, 3, 4],
              });

              // Save Game
              await saveGame(io, rooms[i], winner, {
                toPlayer1: toPlayer1,
                toPlayer2: trtoPlayer2,
              });
            }

            // Room owner out => close room
            if (socket.id === rooms[i].creator.id) {
              socket
                .to(`${rooms[i].roomID}`)
                .emit("Close-Room", rooms[i].roomID);
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
          } else {
            temp.push(rooms[i]);
          }
        }
        rooms = temp;
        io.to("Global-Room").emit("Playing-Room", rooms);
      }
      console.log("disconnect: " + socket.id);
    });
    //QUICK PLAY
    socket.on("Quick-Play", (value) => {
      let check = false;
      //Search
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].status === utils.roomStatus.waiting) {
          if (
            rooms[i].creator.trophy === value.creator.trophy &&
            rooms[i].password === ""
          ) {
            check = true;
            io.to(`${rooms[i].roomID}`).emit("Notify-Quick-Play", {
              roomID: rooms[i].roomID,
              turn: 1,
              time: rooms[i].time,
            });
            // Leave global room
            userWaiting = userWaiting.filter(
              (user) => user._id != value.creator._id
            );
            socket.leave("Global-Room");
            io.to(rooms[i].roomID).emit("Global-Users", userWaiting);
            notifyRoomOwnersGlobalUsers(io);

            const room = rooms.find((room) => room.roomID === rooms[i].roomID);
            room.num = room.num + 1;
            room.players.push({ ...value.creator, id: socket.id });

            socket.emit("Searched-Room", {
              roomID: rooms[i].roomID,
              turn: 2,
              time: rooms[i].time,
            });
            socket.to(rooms[i].roomID).emit("Second-Player", value.creator);
            socket.join(rooms[i].roomID);
            console.log(userWaiting.filter((e) => e.id === rooms[i].roomID));
            socket.emit("First-Player", room.players[0]);

            io.to(socket.id).emit("Private-Room-Chat-Response", room.chats);
            // Board
            //room.board.turn = room.players[0]._id;
            // io.to(`${rooms[i].roomID}`).emit("Room-Owner", room.creator._id);
          }
        }
      }

      /**When don't find any avaiable room then create a new room */
      // Leave global room
      if (!check) {
        userWaiting = userWaiting.filter(
          (user) => user._id != value.creator._id
        );
        socket.leave("Global-Room");
        io.to("Global-Room").emit("Global-Users", userWaiting);
        notifyRoomOwnersGlobalUsers(io);

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
          creator: { ...value.creator, id: socket.id },
          title: value.title,
          num: 1,
          status: utils.roomStatus.waiting,
          players: [{ ...value.creator, id: socket.id, isReady: false }],
          spectators: [],
          chats: [], // Chats will not be saved
          time: 180000, //time default
          password: "",
          // Create Board: no one's turn yet
          //board: utils.createEmptyBoard(),
        };
        rooms.push(newRoom);
        io.to(`${newRoomID}`).emit("Room-Owner-Response", value.creator._id);
        io.to("Global-Room").emit("Playing-Room", rooms);
      }
    });

    socket.on("Cancel-Room", (value) => {
      rooms = rooms.filter((e) => e.roomID !== value._id);
      socket.leave(value._id);
      userWaiting.push({
        id: socket.id,
        _id: value._id,
        username: value.username,
      });
      socket.join("Global-Room");
      io.to("Global-Room").emit("Playing-Room", rooms);
      io.to("Global-Room").emit("Global-Users", userWaiting);
      notifyRoomOwnersGlobalUsers(io);
    });
  });
};

const saveGame = (io, room, winner, option) => {
  return new Promise(async (resolve, reject) => {
    io.to(room.roomID).emit("Loading-Response", true);
    try {
      const winnerIdx = winner === "X" ? 0 : 1;
      const loserIdx = 1 - winnerIdx;
      const winnerU = room.players[winnerIdx];
      const loserU = room.players[loserIdx];
      const trophyTransferred =
        winner !== "None"
          ? utils.calculateTrophyTransfered(winnerU, loserU)
          : 0;

      const player1 = room.players[0];
      const player2 = room.players[1];
      const newGame = await Game.add(player1._id, player2._id, {
        winner: winner,
        totalTime: Date.now() - room.board.timeStart,
        totalX: Math.ceil(room.board.total / 2),
        totalO: Math.floor(room.board.total / 2),
        trophyTransferred: trophyTransferred,
        create_at: Date.now(),
      });
      const promiseAll = [
        Move.addMany(newGame._id, room.board.moves),
        Chat.addMany(newGame._id, room.board.chats),
      ];
      // Set Stat
      if (winner !== "None") {
        winnerU.win += 1;
        winnerU.trophy += trophyTransferred;
        loserU.lose += 1;
        loserU.trophy -= trophyTransferred;
        loserU.trophy = loserU.trophy >= 0 ? loserU.trophy : 0;
        promiseAll.push(
          User.setResult(
            { _id: new ObjectId(winnerU._id) },
            { win: winnerU.win, trophy: winnerU.trophy }
          )
        );
        promiseAll.push(
          User.setResult(
            { _id: new ObjectId(loserU._id) },
            { lose: loserU.lose, trophy: loserU.trophy }
          )
        );
        // Set Rank
        const newWinnerRank = utils.evaluateRank(
          winnerU.win,
          winnerU.lose,
          winnerU.draw,
          winnerU.trophy
        );
        if (winnerU.rank !== newWinnerRank) {
          winnerU.rank = newWinnerRank;
          promiseAll.push(
            User.setRank({ _id: new ObjectId(winnerU._id) }, newWinnerRank)
          );
        }
        const newLoserRank = utils.evaluateRank(
          loserU.win,
          loserU.lose,
          loserU.draw,
          loserU.trophy
        );
        if (loserU.rank !== newLoserRank) {
          loserU.rank = newLoserRank;
          promiseAll.push(
            User.setRank({ _id: new ObjectId(loserU._id) }, newLoserRank)
          );
        }
      } else {
        room.players[0].draw += 1;
        room.players[1].draw += 1;
        promiseAll.push(
          User.setResult(
            { _id: new ObjectId(room.players[0]._id) },
            { draw: room.players[0].draw }
          )
        );
        promiseAll.push(
          User.setResult(
            { _id: new ObjectId(room.players[1]._id) },
            { draw: room.players[1].draw }
          )
        );
      }
      await Promise.all(promiseAll);
      if (option.toPlayer1) {
        io.to(room.players[0].id).emit("Update-User-Response", room.players[0]);
        io.to(room.players[0].id).emit("Update-User-Response", room.players[1]);
      }
      if (option.toPlayer2) {
        io.to(room.players[1].id).emit("Update-User-Response", room.players[0]);
        io.to(room.players[1].id).emit("Update-User-Response", room.players[1]);
      }
      io.to(room.roomID).emit("Loading-Response", false);
      resolve(newGame);
    } catch (err) {
      console.log("Error at saving game");
      io.to(room.roomID).emit("Loading-Response", false);
      reject(err);
    }
  });
};

const notifyRoomOwnersGlobalUsers = (io) => {
  // Notify to all room owners
  rooms.forEach((room) => {
    io.to(room.creator.id).emit("Global-Users", userWaiting);
  });
};
