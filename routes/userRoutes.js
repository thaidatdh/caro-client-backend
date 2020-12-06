let router = require('express').Router();

//Import User Controller
let userController = require('../controllers/userController');

// User routes
router.route('/')
    .get(userController.index)
    .post(userController.add);

router.route('/:user_id')
    .get(userController.view)
    .patch(userController.update)
    .put(userController.update)
    .delete(userController.delete);

router.route('/signup').post(userController.signup);
router.route('/signin').post(userController.signin);
//Export API routes
module.exports = router;