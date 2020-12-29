let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let chatController = require("../controllers/chatController");

// User routes
router
  .route("/")
  .get(verifyToken.verifyAdmin, chatController.index)
  .post(verifyToken.verifyUser, chatController.add)
  .delete(verifyToken.verifyUser, chatController.delete_many);
router
  .route("/:chat_id")
  .get(verifyToken.verifyUser, chatController.view)
  .patch(verifyToken.verifyUser, chatController.update)
  .put(verifyToken.verifyUser, chatController.update)
  .delete(verifyToken.verifyUser, chatController.delete);
  
//Export API routes
module.exports = router;
