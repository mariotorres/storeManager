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
    console.log("Warning: BM_DB env variable is not set\n " +
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
        // check in postgres if a user with username exists or not
        db.oneOrNone('select * from usuarios where usuario = $1', [ username ]).then(function (user) {
            // session

            if (!user){
                console.log('User Not Found with username '+username);
                return done(null, false, req.flash('message', 'Usuario no registrado'));
            }

            if (!isValidPassword(user ,password)){
                console.log('Contraseña no válida');
                return done(null, false, req.flash('message', 'Contraseña no válida')); // redirect back to login page
            }

            return done(null,user);
        }).catch(function (error) {
            console.log(error);
            return done(error);
        });
    }
));

var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.contrasena);
};

// Passport needs to be able to serialize and deserialize users to support persistent login sessions
passport.serializeUser(function(user, done) {
    console.log('serializing user: ');
    console.log(user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
   db.one(' select * from usuarios where id = $1',[ id ]).then(function (user) {
       //console.log('deserializing user:',user);
       done (null, user);
   }).catch(function (error) {
       done(error);
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
    res.redirect('/principal');
};


 // Generates hash using bCrypt
 var createHash = function(password){
 return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
 };



/* Handle Login POST */
router.post('/login', passport.authenticate('login', {
    successRedirect: '/principal',
    failureRedirect: '/',
    failureFlash : true
}));

/* Handle Logout */
router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
});


/* GET login page. */
router.get('/', isNotAuthenticated, function(req, res, next) {
        res.render('index', { title: '', message : req.flash('message') });
});

router.get('/principal',isAuthenticated, function (req, res) {
    res.render('principal', { title: 'Tienda', user: req.user, section: 'principal'});
});

router.get('/admin',isAuthenticated, function (req, res) {

    if ( req.user.permiso_administrador ) {
        res.render('admin', {title: "Panel de administración del sistema", user: req.user, section: 'admin'});
    } else {
        res.redirect('/principal');
    }
});

router.get('/empleados',isAuthenticated, function (req, res) {
    if ( req.user.permiso_empleados ) {
        res.render('empleados', {title: "Panel de empleados", user: req.user, section: 'empleados'});
    } else{
        res.redirect('/principal')
    }

});

router.get('/tablero', isAuthenticated, function (req, res) {
    if (req.user.permiso_tablero) {
        res.render('tablero', {title: "Tablero de control", user: req.user, section: 'tablero'});
    }else {
        res.redirect('/principal');
    }
});

router.get('/carrito', isAuthenticated, function (req, res) {
    res.render('carrito',{title : "Venta en proceso", user: req.user, section: 'carrito'});
});


router.post('/user/profile', function(req,res){
    var user_id = req.body.user_id;
    db.one('select * from usuarios where id = $1', user_id).then(function (user) {
        res.render('partials/user-profile', { user: user });
    }).catch(function (error) {
       console.log(error);
        res.send("Error");
    });
});


router.post('/user/update', function(req, res){
    db.one('update usuarios set nombres=$2, apellido_paterno=$3, apellido_materno=$4, rfc=$5, direccion_calle=$6, direccion_numero_int=$7, ' +
        'direccion_numero_ext=$8, direccion_colonia=$9, direccion_localidad=$10, direccion_municipio=$11, direccion_ciudad=$12, direccion_pais=$13, email=$14 ' +
        'where id = $1 returning id, usuario ',[
        req.body.user_id,
        req.body.nombres,
        req.body.apellido_paterno,
        req.body.apellido_materno,
        req.body.rfc,
        req.body.direccion_calle,
        req.body.direccion_numero_int,
        req.body.direccion_numero_ext,
        req.body.direccion_colonia,
        req.body.direccion_localidad,
        req.body.direccion_municipio,
        req.body.direccion_ciudad,
        req.body.direccion_pais,
        req.body.email
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos del usuario "'+data.usuario+'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
       res.json({
           status : 'Error',
           message: 'Ocurrió un error al actualizar los datos del usuario'
       });
    });
});

router.post('/user/change-password',isAuthenticated,function(req, res){
    res.render('partials/change-password', {user: { id : req.body.user_id } });
});


router.post('/user/update-password',isAuthenticated,function (req, res ) {

    var user_id = req.body.user_id;
    var old_pass = req.body.old_pass;
    var new_pass = req.body.new_pass;
    var confirm_pass = req.body.confirm_pass;

    db.one('select id, contrasena from usuarios where id=$1 ',[user_id]).then(function (user) {

        if ( !isValidPassword(user, old_pass)){
            res.json({
                status : "Error",
                message: "Contraseña incorrecta"
            })
        } else if ( isValidPassword(user, old_pass) && new_pass == confirm_pass ){

            db.one('update usuarios set contrasena = $1 where id =$2 returning id, usuario',[
                bCrypt.hashSync( new_pass, bCrypt.genSaltSync(10), null),
                user.id
            ]).then(function (data) {
                console.log("Usuario "+data.usuario+": Contraseña actualizada");
                res.json({
                    status: "Ok",
                    message: "Contraseña actualizada"
                });
            }).catch(function (error) {
               console.log(error);
               res.json({
                   status: "Error",
                   message: "Ocurrió un error al actualizar la contraseña"
               });
            });
        } else if ( isValidPassword(user, old_pass) && new_pass != confirm_pass ){
            res.json({
                status : "Error",
                message: "La nueva contraseña no coincide"
            })
        }

    }).catch(function (error) {
        console.log(error);
        res.json({
            status : "Error",
            message: "Ha ocurrido un error al actualizar la contraseña"
        })
    })

});


module.exports = router;
