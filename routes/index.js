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
var LocalStrategy = require('passport-local').Strategy;


passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        // check in mongo if a user with username exists or not

        /**
        User.findOne({ 'username' :  username },
            function(err, user) {

                // In case of any error, return using the done method
                if (err)
                    return done(err);
                // Username does not exist, log the error and redirect back
                if (!user){
                    console.log('User Not Found with username '+username);
                    return done(null, false, req.flash('message', 'Usuario no registrado'));
                }
                // User exists but wrong password, log the error
                if (!isValidPassword(user, password)){
                    console.log('Contraseña no válida');
                    return done(null, false, req.flash('message', 'Contraseña no válida')); // redirect back to login page
                }
                // User and password both match, return user from done method
                // which will be treated like success
                return done(null, user);
            }
        );*/

        db.oneOrNone('select * from usuarios where usuario = $1', [ username ]).then(function (user) {
            //password, session
            return done(null,user);
        }).catch(function (error) {
            console.log(error);
            return done(error);
        });
    }
));

var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
};

// Passport needs to be able to serialize and deserialize users to support persistent login sessions
passport.serializeUser(function(user, done) {
    console.log('serializing user: ');
    console.log(user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
   /* User.findById(id, function(err, user) {
        //console.log('deserializing user:',user);
        done(err, user);
    });*/
   db.oneOrNone(' select * from usuarios where id = $1',[ id ]).then(function (user) {
       done (null, user);
   }).catch(function (error) {
       console.log(error);
   });
});

var isAuthenticated = function (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated())
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
};

var isNotAuthenticated = function (req, res, next) {
    if (req.isUnauthenticated())
        return next();
    // if the user is authenticated then redirect him to the main page
    res.redirect('/main');
};


/* Handle Login POST */
router.post('/login', passport.authenticate('login', {
    successRedirect: '/ventas',
    failureRedirect: '/',
    failureFlash : true
}));

/* Handle Logout */
router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
});

/**/


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
