var express = require('express');
var router = express.Router();

var path = require('path');
var fs = require('fs');
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
    db = pgp("postgres://smuser:test@localhost/business");
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

/*
 * ############################################
 *  Exec
 * ############################################
 */

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
        res.render('login', { title: '', message : req.flash('message') });
});

router.get('/principal', isAuthenticated, function (req, res) {
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
      res.redirect('/principal');
    }

});

router.get('/inventario', isAuthenticated, function (req, res ) {
    if ( req.user.permiso_inventario ){
        res.render('inventario',{ title: "Inventario", user: req.user, section : 'inventario'});
    }else {
      res.redirect('/principal');
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
    db.task(function (t) { // El descuento se aplica al total de la venta, no a cada artículo!!!!
        return this.batch([
            this.manyOrNone('select * from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1 order by articulo',[ req.user.id ]),
            this.manyOrNone('select round(sum(precio * unidades_carrito * (1 - discount/(100))), 2) as sum from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1',[ req.user.id ]),
            this.manyOrNone('select round(precio*unidades_carrito*(1 - discount/(100)), 2) as totales from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                'carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1 order by articulo',[ req.user.id ])
        ]);

    }).then(function (data) {
        res.render('carrito',{
            title : "Venta en proceso",
            user: req.user,
            section: 'carrito',
            items: data[0],
            total: data[1],
            totales: data[2]
        });
    }).catch(function (error) {
        console.log(error);
    });
});

router.post('/carrito/inc', isAuthenticated, function (req, res) {
    //console.log("id ITEM: " + req.body.item_id);
    db.task(function (t) {
        return this.batch([
            this.manyOrNone(' update carrito set unidades_carrito = unidades_carrito + 1 ' +
                'where carrito.id_articulo = $1 and carrito.id_usuario = $2 ', [
                numericCol(req.body.item_id),
                numericCol(req.body.user_id)
            ])
        ])
    }).then(function (data) {
        res.json({
            status : 'Ok',
            message: 'Se ha agregado una unidad del artículo: ' + req.body.item_id
        })
    }).catch(function (error) {
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ha ocurrido un error'
        })
    });
});

router.post('/carrito/dec', isAuthenticated, function (req, res) {
    console.log("id ITEM: " + req.body.item_id);
    db.task(function (t) {
        return this.batch([
            this.manyOrNone(' update carrito set unidades_carrito = unidades_carrito - 1 from usuarios, articulos ' +
                'where carrito.id_articulo=$1 and carrito.id_usuario=$2 ' +
                ' and carrito.unidades_carrito > 0', [
                numericCol(req.body.item_id),
                numericCol(req.body.user_id)
            ])
        ])
    }).then(function (data) {
        res.json({
            status : 'Ok',
            message: (data?'Se ha eliminado una unidad del artículo: ' + req.body.item_id : 'Solo queda una unidad del artículo: '+ req.body.item_id)
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ha ocurrido un error'
        })
    });
});

router.post('/carrito/rem', isAuthenticated, function (req, res) {
    db.manyOrNone('delete from carrito where id_usuario=$1 and id_articulo=$2', [ req.body.user_id, req.body.item_id ]).then(function (data) {
        res.json({
            status: 'Ok',
            message : 'El producto se ha removido del carrito'
        })
    }).catch(function (error) {
        console.log(error);
        res.json({
           status : 'Error',
            message : 'Ocurrió un error al remover el producto del carrito'
        });
    });
});

// Carrito Sell
/*return this.batch([
    this.manyOrNone('update articulos set n_existencias = n_existencias - carrito.unidades_carrito from usuarios, carrito ' +
        'where carrito.id_articulo = articulos.id and carrito.id_usuario = usuarios.id and usuarios.id = $1',[
        req.user.id
    ])
])*/
router.post('/carrito/sell', isAuthenticated, function (req, res) {
    db.tx(function (t) {
        return this.manyOrNone(
            'select * from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
            ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1 order by articulo', [
                numericCol(req.body.user_id)
            ]).then(function(data){
            return t.batch([ // En caso de venta con tarjeta, se tienen que mantener ambos registros.
                data,
                t.oneOrNone('insert into ventas ("id_usuario", "precio_venta", "fecha_venta", "hora_venta", ' +
                    '"monto_pagado_efectivo", "monto_pagado_tarjeta", "id_terminal", "saldo_pendiente") ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8) returning id', [
                    numericCol(req.body.user_id),
                    numericCol(req.body.precio_tot),
                    new Date(),
                    new Date().toLocaleTimeString(),
                    numericCol(req.body.monto_efec),
                    (numericCol(req.body.efec_tot) - numericCol(req.body.monto_efec)),
                    req.body.terminal,
                    numericCol(req.body.precio_tot) - numericCol(req.body.efec_tot)
                ])
            ]);
        }).then(function(data){
            var queries= [];
            for(var i = 0; i < data[0].length; i++){
                queries.push(t.oneOrNone('insert into venta_articulos ("id_articulo", "id_venta", "unidades_vendidas", "discount", ' +
                    '"monto_pagado", "monto_por_pagar", "estatus") ' +
                    ' values($1, $2, $3, $4, $5, $6, $7)', [
                    numericCol(data[0][i].id_articulo),
                    numericCol(data[1].id),
                    numericCol(data[0][i].unidades_carrito),
                    numericCol(data[0][i].discount),
                    numericCol(data[0][i].monto_pagado),
                    numericCol(( numericCol(data[0][i].unidades_carrito)* numericCol(data[0][i].precio)*
                        (1- numericCol(data[0][i].discount)/100)) -  numericCol(data[0][i].monto_pagado)),
                    data[0][i].estatus
                ]));

                queries.push(t.oneOrNone('update proveedores set a_cuenta = a_cuenta + $2, por_pagar = por_pagar - $2 where id = $1', [
                    numericCol(data[0][i].id_proveedor),
                    numericCol(data[0][i].costo * data[0][i].unidades_carrito)
                ]));

                queries.push(t.oneOrNone('delete from carrito where id_usuario=$1 and id_articulo=$2',[
                    numericCol(data[0][i].id_usuario),
                    numericCol(data[0][i].id_articulo)
                ]));

                queries.push(t.manyOrNone('update articulos set n_existencias = n_existencias - $2 where id =$1',[
                    numericCol(data[0][i].id_articulo),
                    numericCol(data[0][i].unidades_carrito)
                ]));
            }

            return t.batch(queries);

        });
    }).then(function (data) {
        res.json({
            status : 'Ok',
            message : 'Venta en proceso'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrio un error'
        })
    });
});

// Insertar prenda en carrito
router.post('/carrito/new', isAuthenticated, function(req, res){
    console.log(req.body);
    // Agregar a carrito
    db.tx(function(t){
        return this.one('select count(*) as unidades_carrito from carrito where id_articulo = $1 and id_usuario = $2', [
            numericCol(req.body.item_id),
            numericCol(req.body.user_id)
        ]).then(function(data){
            if(data.unidades_carrito > 0){
                return t.batch([{count: data.unidades_carrito}]);
            }else{
                return t.batch([{count: data.unidades_carrito},
                    t.oneOrNone('insert into carrito ("fecha", "id_articulo", "id_usuario", "discount",  ' +
                        '"unidades_carrito", "estatus", "monto_pagado") ' +
                        ' values($1, $2, $3, $4, $5, $6, $7) ' +
                        ' returning id_articulo',[
                        new Date(),
                        numericCol(req.body.item_id),
                        numericCol(req.body.user_id),
                        numericCol(req.body.optradioDesc),
                        req.body.existencias,
                        req.body.id_estatus,
                        numericCol(req.body.monto_pagado)
                    ])]);
            }
        })
    }).then(function(data){
        var msg = '';
        if(data[0].count > 0){
            msg = 'La prenda ya está en el carrito';
        }else{
            msg = 'La prenda "' + data[1].id_articulo + '" ha sido registrada en el carrito';
        }
        res.json({
            status:'Ok',
            message: msg
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar el artículo'
        });
    });
});

// New item
router.post('/item/new', function(req,res ){
    db.task(function (t) {
        return this.batch([
            this.manyOrNone('select * from tiendas'),
            this.manyOrNone('select * from proveedores'),
            this.manyOrNone('select * from marcas')
        ]);
    }).then(function (data) {
        res.render('partials/new-item', {tiendas: data[0], marcas: data[2], proveedores: data[1]});
    }).catch(function(error){
        console.log(error);
    });
});

// Display de objetos para venta
router.post('/item/list/sale', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from articulos as count where n_existencias > 0'),
            this.manyOrNone('select * from articulos where n_existencias > 0 ' +
                ' order by articulo limit $1 offset $2',[ pageSize, offset ]),
            this.oneOrNone('select * from usuarios where id = $1',[ req.user.id ]),
            this.manyOrNone('select * from terminales'),
            this.manyOrNone('select id from articulos where n_existencias > 0 and not exists ' +
                '( select id_articulo from carrito where unidades_carrito > 0 and articulos.id = carrito.id_articulo) order by articulo limit $1 offset $2',[ pageSize, offset ])
        ]);

    }).then(function (data) {
        res.render('partials/sale-item-list',{
            status : 'Ok',
            items: data[1],
            user: data[2],
            terminales:data[3],
            not_in_carrito: data[4],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});

// Display de notas
router.post('/notes/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;
    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from ventas as count where saldo_pendiente = 0 or monto_pagado_tarjeta > 0 and ' +
                'id_usuario = $1', [req.user.id]), // Sólo se imprimen las notas de las ventas completas o las que tienen pagos con tarjeta
            this.manyOrNone('select * from ventas where saldo_pendiente = 0 or monto_pagado_tarjeta > 0 and id_usuario = $1' +
                ' order by id limit $2 offset $3',[ req.user.id, pageSize, offset ])
        ]);
    }).then(function(data){
        res.render('partials/notes-list',{
            status : 'Ok',
            count: data[0],
            sales: data[1],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});

// Display de objetos
router.post('/item/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from articulos as count where n_existencias > 0'),
            this.manyOrNone('select * from articulos where n_existencias > 0 order by articulo limit $1 offset $2',[ pageSize, offset ])
        ]);

    }).then(function (data) {
        res.render('partials/item-list',{
            status : 'Ok',
            items: data[1],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});


// Display de sucursales
router.post('/store/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from tiendas as count'),
            this.manyOrNone('select * from tiendas order by nombre limit $1 offset $2',[ pageSize, offset ])
        ]);

    }).then(function (data) {
        res.render('partials/store-list',{
            status : 'Ok',
            stores: data[1],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});

// Display de terminales
router.post('/terminal/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from terminales as count'),
            this.manyOrNone('select * from terminales order by nombre_facturador limit $1 offset $2',[ pageSize, offset ])
        ]);

    }).then(function (data) {
        res.render('partials/terminals-list',{
            status : 'Ok',
            terminals: data[1],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});

// Display de marcas
router.post('/marca/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from marcas as count'),
            this.manyOrNone('select * from marcas order by nombre limit $1 offset $2',[ pageSize, offset ])
        ]);
    }).then(function (data) {
        res.render('partials/marcas-list',{
            status : 'Ok',
            marcas: data[1],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        res.json({
            status: 'Error',
            data : error
        });
    });
});

// Load store data into  modal.
router.post('/store/edit-store/', isAuthenticated, function(req, res){
    var id = req.body.id;
    //console.log(id);
    db.one('select * from tiendas where id = $1', [id]).then(function(data){
        res.render('partials/edit-store', {
            status:'Ok',
            store: data
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load terminal data into  modal.
router.post('/terminal/edit-terminal/', isAuthenticated, function(req, res){
    var id = req.body.id;
    //console.log(id);
    db.task(function(t){
        return this.batch([
            db.one('select * from terminales where id = $1', [id]),
            db.manyOrNone('select * from tiendas')
        ])
    }).then(function(data){
        res.render('partials/edit-terminal', {
            status:'Ok',
            terminal: data[0],
            tiendas:data[1]
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load brand data into  modal.
router.post('/brand/edit-brand/', isAuthenticated, function(req, res){
    var id = req.body.id;
    //console.log(id);
    db.task(function (t) {
        return this.batch([
            this.one('select * from marcas where id = $1', [id]),
            this.manyOrNone('select * from proveedores')
        ]);
    }).then(function(data){
        res.render('partials/edit-brand', {
            status:'Ok',
            marca: data[0],
            proveedores: data[1]
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load supplier data into modal
router.post('/supplier/edit-supplier/', isAuthenticated, function(req, res){
    var id = req.body.id;
    db.one('select * from proveedores where id = $1', [id]).then(function(data){
        res.render('partials/edit-supplier', {
            status: 'Ok',
            supplier:data
        });
    }).catch(function(error){
        conslole.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load user data into modal
router.post('/user/edit-user/', isAuthenticated, function(req, res){
    var id = req.body.id;
    db.one('select * from usuarios where id = $1', [id]).then(function(data){
        res.render('partials/edit-user', {
            status: 'Ok',
            user:data
        });
    }).catch(function(error){
        conslole.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load item data into modal
router.post('/item/edit-item/', isAuthenticated, function(req, res){
    var id = req.body.id;
    console.log(id);
   db.task(function (t){
       return this.batch([
           this.one('select * from articulos where id = $1', [id]),
           this.manyOrNone('select * from tiendas'),
           this.manyOrNone('select * from proveedores'),
           this.manyOrNone('select * from marcas')
       ]);
   }).then(function(data){
       res.render('partials/edit-item', {
           status:'Ok',
           item: data[0],
           tiendas: data[1],
           proveedores: data[2],
           marcas: data[3]
       });
   }).catch(function(error){
       console.log(error);
       res.json({
           status:'Error',
           data:error
       });
   });
});

router.post('/supplier/new',function(req, res ){
    res.render('partials/new-supplier');
});

router.post('/type/payment',function(req, res ){
    var page = req.body.page;
    var pageSize = 10;
    var offset = page * pageSize;
    db.task(function(t){
        return this.batch([
            this.manyOrNone('select * from terminales order by nombre_facturador limit $1 offset $2',
            [pageSize, offset]),
            this.manyOrNone('select sum(monto_pagado) as sum from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1',[ req.user.id ]),
            this.manyOrNone('select sum(precio*unidades_carrito*(1- discount/100)) as sum from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1',[ req.user.id ])
        ]);
    }).then(function(data){
        console.log("PRECIO TOT: " + data[2][0].sum);
        res.render('partials/type-payment', {
            status: "Ok",
            user:req.user,
            terminales : data[0],
            total: data[1],
            precio: data[2],
            pageNumber : page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 ) / pageSize )
            });
    }).catch(function (error) {
        console.log(error);
        res.render('partials/type-payment', {
            status: "Error"
        });
    });
});

// Listar proveedores
router.post('/supplier/list/',function(req, res ){
    var page = req.body.page;
    var pageSize = 10;
    var offset = page * pageSize;
    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from proveedores as count'),
            this.manyOrNone('select * from proveedores order by nombre limit $1 offset $2',[ pageSize, offset ])
        ]);
    }).then(function( data ){
        res.render('partials/supplier-list', {
            status : "Ok",
            suppliers: data[1],
            pageNumber : page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 ) / pageSize )
        });
    }).catch(function (error) {
        console.log(error);
        res.render('partials/supplier-list', {
            status: "Error"
        });
    });
});

// Listar usuarios
router.post('/user/list/', function(req, res){
    var page = req.body.page;
    var pageSize = 10;
    var offset = page * pageSize;
    db.task(function(t){
        return this.batch([
            this.one('select count(*) from usuarios as count'),
            this.manyOrNone('select * from usuarios order by usuario limit $1 offset $2', [pageSize, offset])
        ]);
    }).then(function( data ){
        res.render('partials/user-list', {
            status: "Ok",
            users: data[1],
            pageNumber: page,
            numberOfPages: parseInt((+data[0].count + pageSize -1) / pageSize )
        });
    }).catch(function(error){
        console.log(error);
        res.render('partials/user-list', {
            status: "Error"
        });
    });
});

router.post('/store/new', function (req, res) {
    res.render('partials/store');
});


router.post('/terminal/new', function (req, res) {
    db.task(function(t){
        return this.manyOrNone('select * from tiendas')
    }).then(function(data){
        res.render('partials/new-terminal', {tiendas: data});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/brand/new', function (req, res) {
    db.task(function (t) {
        return this.batch([
            this.manyOrNone('select * from proveedores')
        ]);
    }).then(function (data) {
        res.render('partials/new-brand', {proveedores: data[0]});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/user/new',function (req, res) {
    res.render('partials/new-user');
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

/*
 * Registro de artículos
 */

 function numericCol ( x ){
     return ( x == '' || isNaN(x))?null:x;
 }
router.post('/item/register', function(req, res){

    console.log(req.body);
    db.task(function(t) {

        var proveedor = null;

        if (req.body.id_proveedor != null && req.body.id_proveedor != ''){
            proveedor = this.one('update proveedores set a_cuenta=a_cuenta - $2 where id=$1 returning id, nombre',[
                numericCol(req.body.id_proveedor),
                numericCol(req.body.costo)*numericCol(req.body.n_arts)
            ]);
        }

        return this.batch([
            this.one('insert into articulos(id_proveedor, id_tienda, articulo, descripcion, id_marca, modelo, talla, notas, precio, costo, codigo_barras, url_imagen, n_existencias) ' +
                'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id, articulo, n_existencias', [
                numericCol(req.body.id_proveedor),
                numericCol(req.body.id_tienda),
                req.body.articulo,
                req.body.descripcion,
                numericCol(req.body.id_marca),
                req.body.modelo,
                req.body.talla,
                req.body.notas,
                numericCol(req.body.precio),
                numericCol(req.body.costo),
                numericCol(req.body.codigo_barras),
                req.body.url_imagen,
                numericCol(req.body.n_arts)
            ]),
            proveedor
        ])
    }).then(function(data) {
            res.json({
                status: 'Ok',
                message: 'Se '+(data[0].n_existencias == 1?'ha':'han')+' registrado ' + data[0].n_existencias + ' existencia'+(data[0].n_existencias == 1?'':'s')+'  de la prenda ' + data[0].articulo +
                (data[1]?' del proveedor ' + data[1].nombre:'')
            });

    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar el artículo'
        });
    });
});
/*
 * Registro de tiendas
 */
router.post('/store/register', function(req, res){
    db.one('insert into tiendas(nombre, direccion_calle, direccion_numero_int, direccion_numero_ext, direccion_colonia, direccion_localidad, direccion_municipio, direccion_ciudad, direccion_pais) values($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id, nombre ', [
        req.body.nombre,
        req.body.direccion_calle,
        req.body.direccion_numero_int,
        req.body.direccion_numero_ext,
        req.body.direccion_colonia,
        req.body.direccion_localidad,
        req.body.direccion_municipio,
        req.body.direccion_ciudad,
        req.body.direccion_pais
    ]).then(function(data){
        res.json({
            status:'Ok',
            message: '¡La tienda "' + data.nombre + '" ha sido registrada!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar la tienda'
        });
    });
});

/*
 * Registro de terminal
 */
router.post('/terminal/register', function(req, res){
    db.one('insert into terminales(nombre_facturador, id_tienda) values($1, $2) returning id, nombre_facturador ', [
        req.body.nombre,
        req.body.id_tienda
    ]).then(function(data){
        res.json({
            status:'Ok',
            message: '¡La terminal "' + data.id + '" ha sido registrada ' + 'para el facturador "' + data.nombre_facturador + '"!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar la terminal'
        });
    });
});

/*
 * Registro de marca
 */
router.post('/brand/register', function(req, res){
    db.one('insert into marcas(nombre, id_proveedor) values($1, $2) returning id, nombre', [
        req.body.nombre,
        numericCol(req.body.id_proveedor)
    ]).then(function(data){
        res.json({
            status:'Ok',
            message: '¡La marca "' + data.nombre + '" ha sido registrada!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar la terminal'
        });
    });
});

/*
 * Registro de proveedores
 */
router.post('/supplier/register', function(req, res){
  db.one('insert into proveedores(nombre, razon_social, rfc, direccion_calle, direccion_numero_int, direccion_numero_ext, direccion_colonia, direccion_localidad, direccion_municipio, direccion_ciudad, direccion_pais, a_cuenta, por_pagar) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id, nombre ', [
    req.body.nombre,
    req.body.razon_social,
    req.body.rfc,
    req.body.direccion_calle,
    req.body.direccion_numero_int,
    req.body.direccion_numero_ext,
    req.body.direccion_colonia,
    req.body.direccion_localidad,
    req.body.direccion_municipio,
    req.body.direccion_ciudad,
    req.body.direccion_pais,
    0,
    0
  ]).then(function(data){
    res.json({
      status: 'Ok',
      message: '¡El proveedor "' + data.nombre + '" ha sido registrado!'
    });
  }).catch(function (error){
    console.log(error);
    res.json({
      status: 'Error',
      message: 'Ocurrió un error al registar el usuario'
    });
  });
});
/*
 * Actualizacion de proveedores
 */
router.post('/supplier/update', function(req, res){
    db.one('update proveedores set nombre=$2, razon_social=$3, rfc=$4, direccion_calle=$5,'+
        'direccion_numero_int=$6, direccion_numero_ext=$7, direccion_colonia=$8, direccion_localidad=$9,' +
        'direccion_municipio=$10, direccion_ciudad=$11, direccion_pais=$12, a_cuenta=$13, por_pagar=$14 where id=$1 returning id, nombre ', [
        req.body.id,
        req.body.nombre,
        req.body.razon_social,
        req.body.rfc,
        req.body.direccion_calle,
        req.body.direccion_numero_int,
        req.body.direccion_numero_ext,
        req.body.direccion_colonia,
        req.body.direccion_localidad,
        req.body.direccion_municipio,
        req.body.direccion_ciudad,
        req.body.direccion_pais,
        req.body.a_cuenta,
        req.body.por_pagar
    ]).then(function(data){
        res.json({
            status: 'Ok',
            message: '¡El proveedor "' + data.nombre + '" ha sido actualizado!'
        });
    }).catch(function (error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registar el usuario'
        });
    });
});

/*
 * Actualización de tiendas
 */
router.post('/store/update', function(req, res){
    db.one('update tiendas set nombre=$2, direccion_calle=$3, direccion_numero_int=$4, direccion_numero_ext=$5, direccion_colonia=$6, direccion_localidad=$7, ' +
        'direccion_municipio=$8, direccion_ciudad=$9, direccion_pais=$10 ' +
        'where id=$1 returning id, nombre ',[
        req.body.id,
        req.body.nombre,
        req.body.direccion_calle,
        req.body.direccion_numero_int,
        req.body.direccion_numero_ext,
        req.body.direccion_colonia,
        req.body.direccion_localidad,
        req.body.direccion_municipio,
        req.body.direccion_ciudad,
        req.body.direccion_pais
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos de la tienda "'+ data.nombre +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos del artículo'
        });
    });
});

/*
 * Actualización de terminales
 */
router.post('/terminal/update', function(req, res){
    db.one('update terminales set nombre_facturador=$2, id_tienda=$3 where id=$1 returning id, nombre_facturador ',[
        req.body.id,
        req.body.nombre,
        req.body.id_tienda
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos de la terminal "'+ data.id +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos de la terminal'
        });
    });
});

/*
 * Actualización de marcas
 */
router.post('/brand/update', function(req, res){
    db.one('update marcas set nombre=$2, id_proveedor=$3 where id=$1 returning id, nombre ',[
        req.body.id,
        req.body.marca,
        numericCol(req.body.id_proveedor)
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos de la marca "'+ data.nombre +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos de la marca'
        });
    });
});


/*
 * Actualización de items
 */
router.post('/item/update', function(req, res){
    db.one('update articulos set articulo=$2, descripcion=$3, id_marca=$4, modelo=$5, talla=$6, notas=$7, ' +
        'precio=$8, costo=$9, codigo_barras=$10, url_imagen=$11, n_existencias= $12 ' +
        'where id=$1 returning id, articulo ',[
        req.body.id,
        req.body.articulo,
        req.body.descripcion,
        numericCol(req.body.id_marca),
        req.body.modelo,
        req.body.talla,
        req.body.notas,
        numericCol(req.body.precio),
        numericCol(req.body.costo),
        numericCol(req.body.codigo_barras),
        req.body.url_imagen,
        numericCol(req.body.n_existencias)
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos del articulo "'+ data.articulo +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos del artículo'
        });
    });
});

/*
 * Actualización de usuario
 */
router.post('/user/update', function(req, res){
    db.one('update usuarios set nombres=$2, apellido_paterno=$3, apellido_materno=$4, rfc=$5, direccion_calle=$6, direccion_numero_int=$7, ' +
        'direccion_numero_ext=$8, direccion_colonia=$9, direccion_localidad=$10, direccion_municipio=$11, direccion_ciudad=$12, direccion_pais=$13, email=$14 ' +
        'where id = $1 returning id, usuario ',[
        req.body.id,
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
            message : 'Los datos del usuario "'+ data.usuario +'" han sido actualizados'
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

router.post('/reports/', function (req, res) {
   res.render('partials/reports');
});

router.post('/item/find', function (req, res) {
   res.render('partials/find-items');
});

router.get('/item/:id/image.jpg', isAuthenticated, function (req, res) {
   res.sendFile( path.resolve('../images/items/item_1.jpg'));
});

router.get('/user/:id/image.jpg', function (req, res) {
    res.sendFile( path.resolve('../images/users/user_1.png'));
});

module.exports = router;
