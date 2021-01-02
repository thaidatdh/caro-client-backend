//initialize express router
let router = require("express").Router();

//set default API response
router.get("/", function (req, res) {
  res.json({
    status: "API Works",
    message: "Welcome to Caro API",
  });
});

let userRoutes = require("./userRoutes");
let gameRoutes = require("./gameRoutes");
let chatRoutes = require("./chatRoutes");
router.use("/user", userRoutes);
router.use("/game", gameRoutes);
router.use("/chat", chatRoutes);

//Admin routes
router.get("/admin", function (req, res) {
  res.json({
    status: "API Works",
    message: "Welcome to Caro API - Admin",
  });
});
let adminUserRoutes = require("./admin/userRoutes");
router.use("/admin/user", adminUserRoutes);

//Export API routes
module.exports = router;
