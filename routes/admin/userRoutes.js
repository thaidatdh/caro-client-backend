let router = require('express').Router();

//Import User Controller
let userController = require('../../controllers/userController');

// Admin User routes
router.route("/signup").post(userController.adminsignin);
router.route("/").post(userController.addstaff);
//Export API routes
module.exports = router;