var express = require('express');
var router = express.Router();

var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/');
};

/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
