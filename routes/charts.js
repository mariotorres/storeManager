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

/* Dashboard data */
router.get('/sales/data.json', isAuthenticated, function (req, res) {

    const period = {
        start_date : '',//req.query.start_date,
        end_date : '' //req.query.end_date
    };

    db_conf.db.manyOrNone('select fecha_venta, forma_pago, count(*) as conteo, sum(precio_venta) as total from ventas group by id_tienda, forma_pago, fecha_venta',[
        period.start_date, period.end_date
    ]).then(function (data) {

        res.jsonp({
            metadata : { period : period },
            data : data
        });

    }).catch(function (error) {
        console.log(error);
        res.jsonp(error);
    });

});

module.exports = router;