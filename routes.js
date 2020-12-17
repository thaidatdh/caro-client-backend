//initialize express router
let router = require('express').Router();

//set default API response
router.get('/', function(req, res) {
    res.json({
        status: 'API Works',
        message: 'Welcome to Caro ADMIN API'
    });
});

let userRoutes = require('./routes/userRoutes');
router.use('/user', userRoutes);
//Export API routes
module.exports = router;