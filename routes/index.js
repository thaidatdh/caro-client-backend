//initialize express router
let router = require('express').Router();

//set default API response
router.get('/', function(req, res) {
    res.json({
        status: 'API Works',
        message: 'Welcome to Caro API'
    });
});

let userRoutes = require('./userRoutes');
router.use('/user', userRoutes);

//Admin routes
router.get("/admin", function (req, res) {
  res.json({
    status: "API Works",
    message: "Welcome to Caro API - Admin",
  });
});
let adminUserRoutes = require('./admin/userRoutes');
router.use("/admin/user", adminUserRoutes);

//Export API routes
module.exports = router;