const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const User = require("./models/User");

const setupSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) return next(new Error("Authentication error"));
      const getUser = await User.findById(user.id);
      socket.user = getUser;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.user._id);

    socket.on("send_message", async (data) => {
      const message = new Message({
        sender: socket.user._id,
        message: data.message,
      });
      await message.save();
      io.emit("receive_message", {
        sender: socket.user.username,
        message: data.message,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

module.exports = setupSocket;
