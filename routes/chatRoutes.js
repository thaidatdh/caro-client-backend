let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let chatController = require("../controllers/chatController");

// User routes
router.route("/").get(chatController.index).post(chatController.add);

router
  .route("/:chat_id")
  .get(chatController.view)
  .patch(verifyToken, chatController.update)
  .put(verifyToken, chatController.update)
  .delete(verifyToken, chatController.delete);
  
//Export API routes
module.exports = router;
