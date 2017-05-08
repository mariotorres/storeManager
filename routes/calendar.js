/**
 * Created by mtorres on 7/05/17.
 */

var express = require('express');
var router = express.Router();
var db_conf = require('../db_conf');

var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/');
};

//eventos del calendario
router.post('/sales/data.json', isAuthenticated, function (req, res ){
    db_conf.db.manyOrNone("select concat ( 'Ventas: ', count(*) ) as title, to_char(fecha_venta, 'YYYY-MM-DD') as start from ventas group by fecha_venta").then(function (data) {
        res.jsonp( data );
    }).catch(function (error) {
        console.log(error);
        res.jsonp(error);
    });
});

module.exports = router;