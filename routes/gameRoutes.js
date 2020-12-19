let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let gameController = require("../controllers/gameController");

// User routes
router
  .route("/")
  .get(verifyToken.verifyAdmin, gameController.index)
  .post(verifyToken.verifyUser, gameController.add);

router
  .route("/:game_id")
  .get(verifyToken.verifyUser, gameController.view)
  .patch(verifyToken.verifyUser, gameController.update)
  .put(verifyToken.verifyUser, gameController.update)
  .delete(verifyToken.verifyUser, gameController.delete);
  
//Export API routes
module.exports = router;
