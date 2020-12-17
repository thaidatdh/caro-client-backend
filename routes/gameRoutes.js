let router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
//Import User Controller
let gameController = require("../controllers/gameController");

// User routes
router.route("/").get(gameController.index).post(gameController.add);

router
  .route("/:game_id")
  .get(gameController.view)
  .patch(verifyToken, gameController.update)
  .put(verifyToken, gameController.update)
  .delete(verifyToken, gameController.delete);
  
//Export API routes
module.exports = router;
