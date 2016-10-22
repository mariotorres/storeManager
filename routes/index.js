var express = require('express');
var router = express.Router();

var pgp = require("pg-promise")();
var db;

// Linked postgresql docker container
if ( typeof process.env.POSTGRES_PORT_5432_TCP_ADDR != "undefined" ) {
    process.env.DB = 'postgres://';
    process.env.DB += process.env.POSTGRES_USER || 'postgres';
    process.env.DB += ':';
    process.env.DB += process.env.POSTGRES_ENV_POSTGRES_PASSWORD || '';
    process.env.DB += '@';
    process.env.DB += process.env.POSTGRES_PORT_5432_TCP_ADDR;
    process.env.DB += '/';
    process.env.DB += process.env.POSTGRES_DB || 'postgres';
}

if ( typeof process.env.DB != "undefined" ){
    console.log("DB: ", process.env.DB);
    db = pgp( process.env.DB );
} else {
    console.log("Warning: EDCA_DB env variable is not set\n " +
        " defaulting to -> postgres://tester:test@localhost/business");
    db = pgp("postgres://tester:test@localhost/business");
}

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');

router.use(expressSession({secret: 'mySecretKey', resave : false , saveUninitialized: false}));
router.use(passport.initialize());
router.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
router.use(flash());

var bCrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').strategy;

/* GET login page. */
router.get('/', function(req, res, next) {

    db.manyOrNone("select * from sesiones").then(function (data) {
        res.render('index', { title: 'Business Manager', sesiones : data  });
    }).catch(function (error) {
        console.log(error);
    });

});


router.get('/admin', function (req, res) {
   res.render('admin', { title : "Panel de administración del sistema"});
});

router.get('/ventas', function (req, res) {
    res.render('ventas',{title : "Ventas"});
});

router.get('/tablero', function (req, res) {
    res.render('tablero',{title : "Tablero de control"});
});

module.exports = router;
