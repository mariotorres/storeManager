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

// Ventas por periodo
router.get('/sales/data.json', isAuthenticated, function (req, res) {

    //por tienda ...
    const options = {
        start_date : '',//req.query.start_date,
        end_date : '' , //req.query.end_date
        aggregation : 'store'
    };

    db_conf.db.manyOrNone('select fecha_venta, forma_pago, count(*) as conteo, sum(precio_venta) as total from ventas group by id_tienda, forma_pago, fecha_venta',[
        options.start_date, options.end_date
    ]).then(function (data) {

        res.jsonp({
            metadata : { period : options },
            data : data
        });

    }).catch(function (error) {
        console.log(error);
        res.jsonp(error);
    });

});

// Más vendidos
router.get('/best-selling/data.json', function(req, res){
    /* *
     * Query string:
     * start_date
     * end_date
     * aggregation: global || store
     */

    let start_date = req.query.start_date;
    let end_date = req.query.end_date;
    let aggregation = (req.query.aggregation || 'store');
});

// Saldos con proveedores
router.get('/suppliers/data.json', function(req, res){

    db_conf.db.manyOrNone('select * from suppliers').then(function (suppliers) {
        res.jsonp(suppliers );
    }).catch(function (error) {
        console.log(error);
        res.jsonp(error);
    })

});

// Top empleados
router.get('/employees/data.json', function (req, res) {
    /* *
    * Query string:
    * start_date
    * end_date
    * aggregation: global || store
    * */

    let start_date = ( req.query.start_date ||  new Date());
    let end_date = ( req.query.end_date ||  new Date());
    let aggregation = (req.query.aggregation || 'store');

    console.log(aggregation);

    switch ( aggregation ) {
        case 'global':
            db_conf.db.manyOrNone('select * from usuarios', [ start_date, end_date ]).then(function (data) {
                res.jsonp(data);
            }).catch(function (error) {
                console.log(error);
                res.status(400).jsonp(error);
            });
            break;
        case 'store':
            db_conf.db.manyOrNone('select * from usuarios', [ start_date, end_date ]).then(function (data) {
                res.jsonp(data);
            }).catch(function (error) {
                console.log(error);
                res.status(400).jsonp(error);
            });
            break;
        default:
            res.status(400).jsonp({ status : 'Error', message: 'Unsupported aggregation level' });
    }

});


router.get('/barchart/data.json', function (req, res) {
    const data = [
        {letter: 'A', frequency: .08167},
        {letter: 'B', frequency: .01492},
        {letter: 'C', frequency: .02782},
        {letter: 'D', frequency: .04253},
        {letter: 'E', frequency: .12702},
        {letter: 'F', frequency: .02288},
        {letter: 'G', frequency: .02015},
        {letter: 'H', frequency: .06094},
        {letter: 'I', frequency: .06966},
        {letter: 'J', frequency: .00153},
        {letter: 'K', frequency: .00772},
        {letter: 'L', frequency: .04025},
        {letter: 'M', frequency: .02406},
        {letter: 'N', frequency: .06749},
        {letter: 'O', frequency: .07507},
        {letter: 'P', frequency: .01929},
        {letter: 'Q', frequency: .00095},
        {letter: 'R', frequency: .05987},
        {letter: 'S', frequency: .06327},
        {letter: 'T', frequency: .09056},
        {letter: 'U', frequency: .02758},
        {letter: 'V', frequency: .00978},
        {letter: 'W', frequency: .02360},
        {letter: 'X', frequency: .00150},
        {letter: 'Y', frequency: .01974},
        {letter: 'Z', frequency: .00074}
    ];
    res.jsonp(data)
});

module.exports = router;