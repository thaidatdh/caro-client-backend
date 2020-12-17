let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let userController = require("../controllers/userController");

// User routes
router.route("/").get(userController.index).post(userController.add);

router
  .route("/:user_id")
  .get(verifyToken, userController.view)
  .patch(verifyToken, userController.update)
  .put(verifyToken, userController.update)
  .delete(verifyToken, userController.delete);

router.route("/signup").post(userController.signup);
router.route("/login").post(userController.signin);
router.route("/sendValidationEmail").post(userController.sendEmailValidation);
router.route("/emailValidation").post(userController.emailValidation);
//Export API routes
module.exports = router;
