let router = require('express').Router();
const verifyToken = require("../../middlewares/verifyToken");
//Import User Controller
let userController = require('../../controllers/userController');

// Admin User routes
router.route("/login").post(userController.adminsignin);
router.route("/").post(verifyToken.verifyAdmin, userController.addstaff);
//Export API routes
module.exports = router;