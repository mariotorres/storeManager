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

    /*
    * /charts/sales/data.json:
    * If start_date and end_date where specified, it returns the sales of that period, otherwise
    * it takes current date as end_date and end_date - 15 days as start_date.
    * Also, if store_id is set, returns sales only for that store */

    //por tienda ...
    let options = {
        start_date : new Date(),//req.query.start_date,
        end_date : new Date() , //req.query.end_date
        store_id : null
    };

    options.start_date.setDate( options.start_date.getDate() - 15 ); //last 15 days

    if ( typeof req.query.start_date !== 'undefined' && typeof req.query.end_date !== 'undefined'){
        options.start_date = new Date( req.query.start_date );
        options.end_date = new Date( req.query.end_date );
        if (!isNaN(req.query.store_id)) {
            options.store_id = Number(req.query.store_id);
        }
    }

    console.log( 'Options -> ', JSON.stringify(options));

    var sales = null;

    // if store id is not null
    if (options.store_id !== null ){
        sales = db_conf.db.manyOrNone('select fecha_venta, forma_pago, count(*) as conteo, sum(precio_venta) as total from ventas ' +
            'where fecha_venta >= $1 and fecha_venta <= $2 and id_tienda = $3 ' +
            'group by forma_pago, fecha_venta', [
            options.start_date,
            options.end_date,
            options.store_id
        ]);
    }else {
        sales = db_conf.db.manyOrNone('select fecha_venta, forma_pago, count(*) as conteo, sum(precio_venta) as total from ventas ' +
            'where fecha_venta >= $1 and fecha_venta <= $2 ' +
            'group by id_tienda, forma_pago, fecha_venta',[
            options.start_date, options.end_date
        ]);
    }

    sales.then(function (data) {
        res.jsonp({
            metadata : { period : options },
            data : data
        });
    }).catch(function (error) {
        console.log(error);
        res.status(400).jsonp(error);
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

    start_date = req.query.start_date;
    end_date = req.query.end_date;
    aggregation = (req.query.aggregation || 'store');

    switch(aggregation){
        case 'store':
            db_conf.db.manyOrNone('select * from articulos', [ start_date, end_date]).then(function (items) {
                res.jsonp(items);
            }).catch(function (error) {
                res.status(400).jsonp(error);
            });
            break;
        case 'global':
            db_conf.db.manyOrNone('select * from articulos', [ start_date, end_date]).then(function (items) {
                res.jsonp(items);
            }).catch(function (error) {
                res.status(error).jsonp(error);
            });
            break;
        default:
            res.status().jsonp({status:'Error', message: 'Unsupported aggregation level'})
    }
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

    start_date = ( req.query.start_date ||  new Date());
    end_date = ( req.query.end_date ||  new Date());
    aggregation = (req.query.aggregation || 'store');

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