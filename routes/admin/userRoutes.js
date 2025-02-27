let router = require('express').Router();
const verifyToken = require("../../middlewares/verifyToken");
//Import User Controller
let userController = require('../../controllers/userController');

// Admin User routes
router.route("/login").post(userController.adminsignin);
router.route("/facebooklogin").post(userController.adminLoginFacebook);
router.route("/googlelogin").post(userController.adminLoginGoogle);
router.route("/").post(verifyToken.verifyAdmin, userController.addstaff);
router.route("/").get(verifyToken.verifyAdmin, userController.staff_index);
//Export API routes
module.exports = router;