let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let userController = require("../controllers/userController");

router.route("/").get(verifyToken.verifyAdmin, userController.player_index);
router
  .route("/:user_id")
  .get(verifyToken.verifyUser, userController.view)
  .patch(verifyToken.verifyUser, userController.update)
  .put(verifyToken.verifyUser, userController.update)
  .delete(verifyToken.verifyUser, userController.delete);

router.route("/signup").post(userController.signup);
router.route("/login").post(userController.signin);
router.route("/facebooklogin").post(userController.loginFacebook);
router.route("/googlelogin").post(userController.loginGoogle);
router.route("/sendValidationEmail").post(userController.sendEmailValidation);
router
  .route("/emailValidation")
  .post(verifyToken.verifyUserExist, userController.emailValidation);
router.route("/sendEmailResetPassword").post(userController.sendEmailResetPassword);
router
  .route("/resetPassword")
  .post(verifyToken.verifyUserExist, userController.resetPassword);
//Export API routes
module.exports = router;
