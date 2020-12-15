//queue
let userWaiting = [];
let rooms = [];
let userPlaying = [];
let interval;

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
      rooms.push({
        roomID: socket.id,
        creator: value.creator,
        title: value.title,
        num: 1,
      });
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
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value.roomID) {
          rooms[i].num++;
        }
      }
      io.to(value.roomID).emit("Second-Player", value.player);
      socket.join(value.roomID);
      console.log(userWaiting.filter((e) => e.id === value.roomID));
      socket.emit(
        "First-Player",
        userWaiting.filter((e) => e.id === value.roomID)[0]
      );
    });

    //LEAVE ROOM
    socket.on("Leave-Room", (value) => {
      const temp = [];
      for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomID === value) {
          socket.leave(`${rooms[i].roomID}`);
          socket.to(`${rooms[i].roomID}`).emit("Leave-Room-Player", socket.id);
          if (rooms[i].num > 1) {
            rooms[i].num--;
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
