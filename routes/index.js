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
                'carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1 order by articulo',[ req.user.id ]),
            this.manyOrNone('select sum(monto_pagado) as sum from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
                ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1',[ req.user.id ]),
        ]);

    }).then(function (data) {
        res.render('carrito',{
            title : "Venta en proceso",
            user: req.user,
            section: 'carrito',
            items: data[0],
            total: data[1],
            totales: data[2],
            monto: data[3]
        });
    }).catch(function (error) {
        console.log(error);
    });
});

// Impresión de notas
router.get('/nota', isAuthenticated, function (req, res) {
    db.task(function (t) {

    }).then(function (data) {
        res.render('nota',{
            title : "Impresión en proceso",
            user: req.user,
            section: 'nota',
            items:[]
        });
    }).catch(function (error) {
        console.log(error);
    });
});


router.post('/carrito/inc', isAuthenticated, function (req, res) {
    //console.log("id ITEM: " + req.body.item_id);
    db.one('update carrito set unidades_carrito = unidades_carrito + 1 ' +
        'where carrito.id_articulo = $1 and carrito.id_usuario = $2 returning id_articulo', [
        numericCol(req.body.item_id),
        numericCol(req.body.user_id)
    ]).then(function (data) {
        res.json({
            status : 'Ok',
            message: 'Se ha agregado una unidad del artículo: ' + data.id_articulo
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
    //console.log("id ITEM: " + req.body.item_id);
    db.oneOrNone(' update carrito set unidades_carrito = unidades_carrito - 1 '+//from usuarios, articulos ' +
        'where id_articulo=$1 and id_usuario=$2 and carrito.unidades_carrito > 1 returning id_articulo', [
        numericCol(req.body.item_id),
        numericCol(req.body.user_id)
    ]).then(function (data) {
        res.json({
            status : 'Ok',
            message: (data?'Se ha eliminado una unidad del artículo: ' + data.id_articulo : 'Solo queda una unidad del artículo: '+ data.id_articulo)
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
    db.one('delete from carrito where id_usuario=$1 and id_articulo=$2 returning id_articulo', [ req.body.user_id, req.body.item_id ]).then(function (data) {
        res.json({
            status: 'Ok',
            message : 'El producto '+ data.id_articulo +' se ha removido del carrito'
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
router.post('/carrito/sell', isAuthenticated, function (req, res) {
    db.tx(function (t) {
        console.log(req.body);
        return this.manyOrNone(
            'select * from carrito, articulos, usuarios where carrito.id_articulo = articulos.id and ' +
            ' carrito.id_usuario = usuarios.id and carrito.unidades_carrito > 0 and usuarios.id = $1 order by articulo', [
                numericCol(req.body.user_id)
            ]).then(function(data){
            return t.batch([ // En caso de venta con tarjeta, se tienen que mantener ambos registros.
                data,
                t.oneOrNone('insert into ventas ("id_usuario", "precio_venta", "fecha_venta", "hora_venta", ' +
                    '"monto_pagado_efectivo", "monto_pagado_tarjeta", "id_terminal", "saldo_pendiente", "estatus", "tarjeta_credito", "monto_cambio") ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id', [
                    numericCol(req.body.user_id),
                    numericCol(req.body.precio_tot),
                    new Date(),
                    new Date().toLocaleTimeString(),
                    numericCol(req.body.monto_efec),
                    (numericCol(req.body.efec_tot) - numericCol(req.body.monto_efec)),
                    req.body.terminal,
                    numericCol(req.body.precio_tot) - numericCol(req.body.efec_tot),
                    "activa",
                    req.body.optradio == "cred",
                    (numericCol(req.body.monto_rec) - numericCol(req.body.monto_efec))
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

                queries.push(t.manyOrNone('update articulos set n_existencias = n_existencias - $2, fecha_ultima_modificacion = $3 where id =$1',[
                    numericCol(data[0][i].id_articulo),
                    numericCol(data[0][i].unidades_carrito),
                    new Date()
                ]));
            }

            return t.batch(queries);

        });
    }).then(function (data) {
        res.json({
            status : 'Ok',
            message : 'La venta ha sido registrada exitosamente'
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

    db.one('select count(*) as unidades_carrito from carrito where id_articulo = $1 and id_usuario = $2', [
        numericCol(req.body.item_id),
        numericCol(req.body.user_id)
    ]).then(function(data){
        if(data.unidades_carrito > 0){

            console.log('La prenda ya está en el carrito');

            res.json({
                status:'Ok',
                message: 'La prenda ya está en el carrito'
            });

        } else {

            db.oneOrNone('insert into carrito ("fecha", "id_articulo", "id_usuario", "discount",  ' +
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
            ]).then(function (data) {
                console.log('Artículo añadido al carrito');
                res.json({
                    status:'Ok',
                    message: 'La prenda "' + data.id_articulo + '" ha sido registrada en el carrito'
                });
            }).catch(function (error) {
                console.log(error);
                res.json({
                    status: 'Error',
                    message: 'Ocurrió un error'
                });
            });

        }
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar el artículo'
        });
    });

});

// New item
router.post('/item/new', isAuthenticated,function(req,res ){
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
//esto está mal
router.post('/item/list/sale', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from articulos as count '/*where n_existencias > 0'*/),
            this.manyOrNone('select * from articulos ' /*where n_existencias > 0 '*/ +
                'order by articulo limit $1 offset $2',[ pageSize, offset ]),
            this.oneOrNone('select * from usuarios where id = $1',[ req.user.id ]),
            this.manyOrNone('select * from terminales'),
            /*this.manyOrNone('select id from articulos where n_existencias > 0 and not exists ' +
                '( select id_articulo from carrito where unidades_carrito > 0 and articulos.id = carrito.id_articulo) order by articulo limit $1 offset $2',[ pageSize, offset ])*/
        ]);

    }).then(function (data) {
        res.render('partials/sale-item-list',{
            status : 'Ok',
            items: data[1],
            user: data[2],
            terminales:data[3],
            //not_in_carrito: data[4],
            pageNumber : req.body.page,
            numberOfPages: parseInt( (+data[0].count + pageSize - 1 )/ pageSize )
        });
    }).catch(function (error) {
        console.log(error);
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
            this.one('select count(*) from ventas as count where ' +
                'id_usuario = $1', [req.user.id]), // Sólo se imprimen las notas de las ventas completas o las que tienen pagos con tarjeta
            this.manyOrNone('select * from ventas where id_usuario = $1 and estatus = $4 ' +
                ' order by id desc limit $2 offset $3',[ req.user.id, pageSize, offset, "activa"])
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


// Display de notas para imprimir
router.post('/print/notes/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;
    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from ventas as count where  ' +
                'id_usuario = $1', [req.user.id]), // Sólo se imprimen las notas de las ventas completas o las que tienen pagos con tarjeta
            this.manyOrNone('select * from ventas where id_usuario = $1 and estatus = $4 ' +
                ' order by id desc limit $2 offset $3',[ req.user.id, pageSize, offset, "activa"])
        ]);
    }).then(function(data){
        res.render('partials/print-notes-list',{
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
            this.one('select count(*) from articulos as count '/*where n_existencias > 0'*/),
            this.manyOrNone('select * from articulos '/*where n_existencias > 0*/+' order by articulo limit $1 offset $2',[ pageSize, offset ])
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
// Display de bonos
router.post('/bonus/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from bonos as count'),
            this.manyOrNone('select * from bonos order by nombre limit $1 offset $2',[ pageSize, offset ])
        ]);
    }).then(function (data) {
        res.render('partials/bonus-list',{
            status : 'Ok',
            bonos: data[1],
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
// Display de préstamos
router.post('/lending/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;
    db.task(function (t) {
        return t.batch([
            t.one('select count(*) from prestamos as count'),
            t.manyOrNone('select * from prestamos, usuarios where usuarios.id = prestamos.id_usuario order by nombres limit $1 offset $2', [pageSize, offset])
        ])
    }).then(function (data) {
        console.log(data.length);
        res.render('partials/lending-list',{
            status : 'Ok',
            lendings: data[1],
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

// Display de penalizaciones
router.post('/penalization/list/', isAuthenticated, function (req, res) {
    var pageSize = 10;
    var offset = req.body.page * pageSize;

    db.task(function (t) {
        return this.batch([
            this.one('select count(*) from penalizaciones as count'),
            this.manyOrNone('select * from penalizaciones order by nombre limit $1 offset $2',[ pageSize, offset ])
        ]);
    }).then(function (data) {
        res.render('partials/penalization-list',{
            status : 'Ok',
            penalizations: data[1],
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

router.get('/notes/getbyid/:id', isAuthenticated, function ( req, res ){
    var id = req.params.id;

    db.task(function (t) {

        return this.batch([
            t.one('select * from ventas, terminales where ventas.id = $1 and ventas.id_terminal = terminales.id', [ id ]),
            t.manyOrNone('select * from venta_articulos, articulos where venta_articulos.id_venta = $1 and ' +
                'venta_articulos.id_articulo = articulos.id', [ id ])
        ]).then(function (data) {

            return t.batch([
                data[0],
                t.one('select * from terminales, tiendas where terminales.id = $1 and tiendas.id = terminales.id_tienda', data[0].id_terminal),
                t.one('select * from usuarios where id = $1', data[0].id_usuario),
                data[1]
            ]);

        });

    }).then(function (data) {

        res.render('partials/ticket',{
            venta: data[0],
            tienda: data[1],
            usuario: data[2],
            articulos: data[3]
        });
    }).catch(function (error) {
        console.log(error);
    });

});

// Load sales data into  modal.
router.post('/notes/edit-note/', isAuthenticated, function(req, res){
    var id = req.body.sales_id;
    var user_id = req.body.user_id;

    console.log('user_id: ',user_id);
    console.log( 'sale_id: ',id );

    db.task(function (t) {

        return this.batch([
            t.oneOrNone(
                'select * from ventas where id=$1 ' /*and (saldo_pendiente = 0 or monto_pagado_tarjeta > 0)*/ + 'and id_usuario=$2', [
                    numericCol(id),
                    numericCol(user_id)
                ]),
            t.oneOrNone(
                'select sum(unidades_vendidas) as sum from venta_articulos where id_venta=$1',
                [numericCol(id)]
            ),
            t.manyOrNone(
                'select * from venta_articulos where id_venta=$1',
                [numericCol(id)]
            ),
            t.oneOrNone(
                'select * from usuarios where id=$1',
                [numericCol(user_id)]
            )
        ]).then(function(data){

            var identifiers = [];
            for(var i = 0; i < data[2].length; i++){  // data[2] -> Artículos
                identifiers.push( data[2][i].id_articulo);
            }
            console.log('Artículos: ', identifiers);

            return t.batch([
                {venta: data[0]}, //venta
                {total_unidades: data[1]}, //unidades vendidas
                {articulos: data[2]}, //artículos vendidos
                {vendedor: data[3]}, //vendedor
                t.manyOrNone('select * from articulos where id IN ($1:csv)', [ identifiers ])
            ]);


        })

    }).then(function(data){
        //console.log("Length data: " + JSON.stringify(data[1][0]));
        res.render('partials/edit-note', {
            status:'Ok',
            sale: data[0].venta,
            n_items_sale: data[1].total_unidades,
            items_sale: data[2].articulos,
            user: data[3].vendedor,
            items: data[4]
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
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
    console.log(id);
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

// Load bonus data into  modal.
router.post('/bonus/edit-bonus/', isAuthenticated, function(req, res){
    var id = req.body.id;
    db.one('select * from bonos where id = $1', [
        id
    ]).then(function(data){
        res.render('partials/edit-bonus', {
            status:'Ok',
            bonus: data
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load bonus data into  modal.
router.post('/lending/edit-lending/', isAuthenticated, function(req, res){
    var id = req.body.id;
    db.task(function(t){
        return t.batch([
            db.one('select * from prestamos, usuarios where prestamos.id = $1 and prestamos.id_usuario = usuarios.id ', [
                id
            ]),
            db.manyOrNone('select * from usuarios')
        ])
    }).then(function(data){
        res.render('partials/edit-lending', {
            status:'Ok',
            lendings: data[0],
            usuarios: data[1]
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status:'Error',
            data:error
        });
    });
});

// Load penalization data into  modal.
router.post('/penalization/edit-penalization/', isAuthenticated, function(req, res){
    var id = req.body.id;
    db.one('select * from penalizaciones where id = $1', [
        id
    ]).then(function(data){
        res.render('partials/edit-penalization', {
            status:'Ok',
            penalization: data
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
    db.task(function(t){
        return t.batch([
            db.one('select * from usuarios where id = $1', [id]),
            db.manyOrNone('select * from tiendas')
        ])
    }).then(function(data){
        res.render('partials/edit-user', {
            status: 'Ok',
            user: data[0],
            tiendas: data[1]
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

// Load item data into modal
router.post('/item/return-item/', isAuthenticated, function(req, res){
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
        res.render('partials/return-item', {
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

router.post('/supplier/new', isAuthenticated,function(req, res ){
    res.render('partials/new-supplier');
});

router.post('/type/payment',function(req, res ){

    db.task(function(t){
        return this.batch([
            this.manyOrNone('select * from terminales order by nombre_facturador '),
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
            precio: data[2]
            });
    }).catch(function (error) {
        console.log(error);
        res.render('partials/type-payment', {
            status: "Error"
        });
    });
});

// Listar proveedores
router.post('/supplier/list/', isAuthenticated,function(req, res ){
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
router.post('/user/list/', isAuthenticated, function(req, res){
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

router.post('/store/new', isAuthenticated,function (req, res) {
    res.render('partials/store');
});


router.post('/terminal/new', isAuthenticated,function (req, res) {
    db.task(function(t){
        return this.manyOrNone('select * from tiendas')
    }).then(function(data){
        res.render('partials/new-terminal', {tiendas: data});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/employees/penalization/new', function (req, res) {
    db.task(function (t) {
    }).then(function (data) {
        res.render('partials/new-penalization', {});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/employees/bonus/new', function (req, res) {
    db.task(function (t) {
    }).then(function (data) {
        res.render('partials/new-bonus', {});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/employees/lending/new', function (req, res) {
    db.manyOrNone('select * from usuarios').then(function (data) {
        res.render('partials/new-lending', {usuarios: data});
    }).catch(function(error){
        console.log(error);
    });
});

router.post('/brand/new',isAuthenticated, function (req, res) {
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

router.post('/user/new',isAuthenticated,function (req, res) {
    db.manyOrNone('select * from tiendas').then(function(data){
        res.render('partials/new-user', {tiendas: data});
    }).catch(function (error) {
        console.log(error);
        res.send("Error");
    });
});

router.post('/user/profile', isAuthenticated, function(req,res){
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

function stob( str) {
    return (str == 'true')
}

/* uploads */
var multer = require ('multer');

var upload = multer({
    dest: path.resolve('../uploads/')
});

router.post('/item/register', upload.single('imagen'),function(req, res){
    //console.log(req.body);
    //console.log(req.file );
    db.task(function(t) {

        return this.oneOrNone('select count(*) as count from articulos where id_proveedor = $1 and id_tienda = $2 and articulo = $3 and' +
            ' modelo = $4 and id_marca = $5',[
            numericCol(req.body.id_proveedor),
            numericCol(req.body.id_tienda),
            req.body.articulo,
            req.body.modelo,
            numericCol(req.body.id_marca)
        ]).then(function(data){

            //Si el producto se registró previamente
            if ( data.count > 0 ) {
                return [{count: data.count }];
            } else {
                //Si el artículo tiene un proveedor, se agrega a la cuenta
                var proveedor = null;
                if (req.body.id_proveedor != null && req.body.id_proveedor != ''){
                    proveedor = t.one('update proveedores set a_cuenta=a_cuenta - $2 where id=$1 returning id, nombre',[
                        numericCol(req.body.id_proveedor),
                        numericCol(req.body.costo)*numericCol(req.body.n_arts)
                    ]);
                }

                // retorna los queries
                return t.batch([
                    {count : data.count},
                    t.one('insert into articulos(id_proveedor, id_tienda, articulo, descripcion, id_marca, modelo, talla, notas, precio, costo, codigo_barras, nombre_imagen, n_existencias, fecha_registro, fecha_ultima_modificacion) ' +
                        'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, Now(), Now()) returning id, articulo, n_existencias', [
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
                        typeof req.file != 'undefined'?req.file.filename:null,
                        numericCol(req.body.n_arts)
                    ]),
                    proveedor
                ]);
            }
        })
    }).then(function(data) {
        if ( data[0].count == 0 ){
            res.json({
                status: 'Ok',
                message: 'Se ' + (data[1].n_existencias == 1 ? 'ha' : 'han') + ' registrado ' + data[1].n_existencias + ' existencia' + (data[1].n_existencias == 1 ? '' : 's') + '  de la prenda ' + data[1].articulo +
                (data[2] ? ' del proveedor ' + data[2].nombre : '')
            });
        }else{
            res.json({
                status: 'Error',
                message: '¡Precaución! Existe un registro previo de la prenda ' + data[1].articulo
            });
        }
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
router.post('/store/register', isAuthenticated,function(req, res){
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
 * Nuevos usuarios
 */



router.post('/user/signup', isAuthenticated, function(req, res){

    db.one('select count(*) as count from usuarios where usuario =$1',[ req.body.usuario ]).then(function (data) {

        // 8 char pass
        // no special char in username

        if ( req.body.contrasena != req.body.confirmar_contrasena){
            return { id: -2 };
        }

        if ( data.count > 0) {
            return { id: -1 };
        }

        return db.one('insert into usuarios ( usuario, contrasena, email, nombres, apellido_paterno, apellido_materno, rfc, direccion_calle, direccion_numero_int, ' +
            'direccion_numero_ext, direccion_colonia, direccion_localidad, direccion_municipio, direccion_ciudad, direccion_estado, direccion_pais,' +
            'empleado, salario, permiso_tablero, permiso_administrador, permiso_empleados, permiso_inventario, id_tienda) values' +
            '($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) returning id, usuario ', [
            req.body.usuario.trim(),
            bCrypt.hashSync( req.body.contrasena, bCrypt.genSaltSync(10), null),
            req.body.email,
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
            req.body.direccion_estado,
            req.body.direccion_pais,
            stob(req.body.empleado),
            numericCol(req.body.salario),
            stob(req.body.permiso_tablero),
            stob(req.body.permiso_administrador),
            stob(req.body.permiso_empleados),
            stob(req.body.permiso_inventario),
            numericCol(req.body.id_tienda)
            //req.body.llegada,
            //req.body.salida
        ]);


    }).then(function (data) {

        var response = { status: '', message: ''};
        switch ( data.id ){
            case -1:
                response.status ='Error';
                response.message = 'Ya existe un usuario registrado con ese nombre, pruebe uno distinto';
                break;
            case -2:
                response.status = 'Error';
                response.message = 'La contraseña no coincide';
                break;
            default:
                response.status = 'Ok';
                response.message = 'El usuario "' + data.usuario + '" ha sido registrado';
        }

        res.json(response);

    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al registrar el nuevo usuario'
        });
    });
});

/*
 * Registro de terminal
 */
router.post('/terminal/register', isAuthenticated, function(req, res){
    db.one('insert into terminales(nombre_facturador, rfc, id_tienda) values($1, $2, $3) returning id, nombre_facturador ', [
        req.body.nombre,
        req.body.rfc,
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
 * Registro de préstamo
 */
router.post('/employees/lending/register', function(req, res){
    console.log(req.body);
    db.tx(function(t){
        return t.batch([
            db.one('insert into prestamos(id_usuario, monto, descripcion, fecha_prestamo, fecha_liquidacion, pago_semanal) ' +
                ' values($1, $2, $3, $4, $5, $6) returning id, monto', [
                req.body.id_usuario,
                numericCol(req.body.monto),
                req.body.desc,
                req.body.fecha_prestamo,
                req.body.fecha_liquidacion,
                numericCol(req.body.monto_semanal)
            ]),
            db.one('select * from usuarios where id = $1', req.body.id_usuario)
        ])
    }).then(function(data){
        res.json({
            status:'Ok',
            message: '¡El préstamo de "' + data[0].monto + '" pesos para el usuario "' + data[1].nombres + '" ha sido registrado!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar el préstamo.'
        });
    });
});

/*
 * Registro de bono
 */
router.post('/employees/bonus/register', function(req, res){
    console.log(req.body);
    db.one('insert into bonos(nombre, monto, descripcion, monto_alcanzar, criterio, temporalidad) ' +
        ' values($1, $2, $3, $4, $5, $6) returning id, nombre', [
        req.body.nombre,
        numericCol(req.body.monto),
        req.body.desc,
        numericCol(req.body.monto_alcanzar),
        req.body.criterio,
        req.body.temporalidad
    ]).then(function(data){
        res.json({
            status:'Ok',
            message: '¡El bono: "' + data.nombre + '" ha sido registrado!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar el bono.'
        });
    });
});

/*
 * Registro de penalizacion
 */
router.post('/employees/penalization/register', function(req, res){
    console.log(req.body);
    db.one('insert into penalizaciones(nombre, monto, descripcion, dias_retraso, dias_ausencia) ' +
        ' values($1, $2, $3, $4, $5) returning id, nombre', [
        req.body.nombre,
        numericCol(req.body.monto),
        req.body.desc,
        numericCol(req.body.retraso),
        numericCol(req.body.ausencia)
    ]).then(function(data){
        res.json({
            status:'Ok',
            message: '¡La penalización: "' + data.nombre + '" ha sido registrada!'
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al registrar la penalización.'
        });
    });
});

/*
 * Registro de marca
 */
router.post('/brand/register', isAuthenticated, function(req, res){
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
router.post('/supplier/register', isAuthenticated,function(req, res){
  db.one('insert into proveedores(nombre, razon_social, rfc, direccion_calle, direccion_numero_int, direccion_numero_ext, ' +
      'direccion_colonia, direccion_localidad, direccion_municipio, direccion_ciudad, direccion_pais, a_cuenta, por_pagar) ' +
      'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id, nombre ', [
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
router.post('/supplier/update', isAuthenticated,function(req, res){
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
router.post('/store/update', isAuthenticated, function(req, res){
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
router.post('/terminal/update', isAuthenticated,function(req, res){
    db.one('update terminales set nombre_facturador=$2, id_tienda=$3, rfc=$4 where id=$1 returning id, nombre_facturador ',[
        req.body.id,
        req.body.nombre,
        req.body.id_tienda,
        req.body.rfc
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
router.post('/brand/update', isAuthenticated, function(req, res){
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
 * Actualización de prestamos
 */
router.post('/lendings/update', isAuthenticated, function(req, res){
    console.log(req.body);
    db.one('update prestamos set id_usuario=$2, monto=$3, descripcion=$4, fecha_prestamo=$5, fecha_liquidacion=$6, pago_semanal=$7 where id=$1 returning id, monto ',[
        req.body.id,
        req.body.id_usuario,
        numericCol(req.body.monto),
        req.body.desc,
        new Date(req.body.fecha_prestamo),
        new Date(req.body.fecha_liquidacion),
        numericCol(req.body.monto_semanal)
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos del prestamo "'+ data.id +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos del bono'
        });
    });
});

/*
 * Actualización de bonos
 */
router.post('/bonus/update', isAuthenticated, function(req, res){
    console.log(req.body);
    db.one('update bonos set nombre=$2, monto=$3, descripcion=$4, monto_alcanzar=$5, criterio=$6, temporalidad=$7 where id=$1 returning id, nombre ',[
        req.body.id,
        req.body.nombre,
        numericCol(req.body.monto),
        req.body.desc,
        numericCol(req.body.monto_alcanzar),
        req.body.criterio,
        req.body.temporalidad
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos del bono "'+ data.nombre +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos del bono'
        });
    });
});

/*
 * Actualización de penalizaciones
 */
router.post('/penalization/update', isAuthenticated, function(req, res){
    db.one('update penalizaciones set nombre=$2, monto=$3, descripcion=$4, dias_retraso=$5, dias_ausencia=$6 where id=$1 returning id, nombre ',[
        req.body.id,
        req.body.nombre,
        numericCol(req.body.monto),
        req.body.desc,
        numericCol(req.body.retraso),
        numericCol(req.body.ausencia)
    ]).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Los datos de la penalización "'+ data.nombre +'" han sido actualizados'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al actualizar los datos de la penalización'
        });
    });
});

/*
 * Actualización de items
 */
router.post('/item/update', upload.single('imagen'), function(req, res){

    db.tx(function (t) {
        return this.batch([
            t.one('select nombre_imagen from articulos where id = $1',[req.body.id ]),
            t.one('update articulos set articulo=$2, descripcion=$3, id_marca=$4, modelo=$5, talla=$6, notas=$7, ' +
                'precio=$8, costo=$9, codigo_barras=$10, nombre_imagen=$11, n_existencias= $12, fecha_ultima_modificacion = Now() ' +
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
                typeof req.file != 'undefined'?req.file.filename:null,
                numericCol(req.body.n_existencias)
            ])
        ]);
    }).then(function (data) {

        // borra la imagen anterior
        fs.unlinkSync(path.resolve('../uploads/'+ data[0].nombre_imagen));
        console.log('successfully deleted '+ path.resolve('../uploads/'+ data[0].nombre_imagen));

        res.json({
            status :'Ok',
            message : 'Los datos del articulo "'+ data[1].articulo +'" han sido actualizados'
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
 * Devolución de items
 */
router.post('/item/return', isAuthenticated, function(req, res){
    db.tx(function(t){
        return t.batch([
            t.one('update articulos set n_existencias = $2, fecha_ultima_modificacion = $3 where id=$1 returning id, articulo', [
                req.body.id,
                numericCol(req.body.n_existencias) - numericCol(req.body.n_devoluciones),
                new Date()
            ]),
            t.one('update proveedores set a_cuenta = a_cuenta + $2 where id = $1 returning nombre', [
                numericCol( req.body.id_proveedor),
                numericCol( req.body.costo *  req.body.n_devoluciones)
            ]),
            t.one('insert into devolucion_prov_articulos ("id_articulo" , "id_proveedor", "unidades_regresadas", "fecha", "costo_unitario") values( ' +
                '$1, $2, $3, Now(), $4) returning id', [
                numericCol(req.body.id),
                numericCol(req.body.id_proveedor),
                numericCol(req.body.n_devoluciones),
                numericCol(req.body.costo)
            ]),
            t.one('insert into ventas ("id_usuario", "precio_venta", "fecha_venta", "hora_venta", ' +
                '  "estatus", "monto_pagado_efectivo", "saldo_pendiente") ' +
                'values($1, $2, $3, $4, $5, $6, $7) returning id', [
                numericCol(req.user.id),
                numericCol(req.body.costo)*numericCol(req.body.n_devoluciones),
                new Date(),
                new Date().toLocaleTimeString(),
                "activa",
                numericCol(req.body.costo)*numericCol(req.body.n_devoluciones),
                0
            ])
        ]).then(function(data){
            t.oneOrNone('insert into venta_articulos ("id_articulo", "id_venta", "unidades_vendidas", ' +
                '"monto_pagado", "estatus") ' +
                ' values($1, $2, $3, $4, $5)', [
                numericCol(req.body.id),
                numericCol(data[3].id),
                numericCol(req.body.n_devoluciones),
                numericCol(req.body.costo),
                "dev_proveedor"
            ])
            return data;
        });
    }).then(function (data) {
        res.json({
            status :'Ok',
            message : 'Se ha registrado la devolución del artículo: "'+ data[0].articulo +'" del proveedor: "' + data[1].nombre + '"'
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
* Ingreso empleados
*/
router.post('/employee/check-in', function(req,res ){
    db.one("select count(*) from asistencia where fecha = date_trunc('day', now()) and tipo = 'entrada' and id_usuario = $1",[
        numericCol(req.user.id)
    ]).then(function(data){
        if(data.count > 0) {
            return null
        }
        return db.one('insert into asistencia ("id_usuario", "fecha", "hora", "tipo" ) ' +
            'values($1, $2, $3, $4) returning id', [
            numericCol(req.user.id),
            new Date(),
            new Date().toLocaleTimeString(),
            "entrada"
        ]);
    }).then(function (user) {
        var message = 'El usuario "' + req.user.nombres + '" ya había registrado entrada';
        if(user != null){
            message =  'Que tengas  un buen día ' + req.user.nombres;
        }
        res.json({
            status: 'Ok',
            message: message
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error a la hora de registrar la entrada'
        });
    });
});


/*
 * Salida empleados
 */
router.post('/employee/check-out', function(req,res ){
    db.one("select count(*) from asistencia where fecha = date_trunc('day', now()) and tipo = 'salida' and id_usuario = $1",[
        numericCol(req.user.id)
    ]).then(function(data){
        if(data.count > 0)
            return null;
        return db.one('insert into asistencia ("id_usuario", "fecha", "hora", "tipo" ) ' +
            'values($1, $2, $3, $4) returning id', [
            numericCol(req.user.id),
            new Date(),
            new Date().toLocaleTimeString(),
            "salida"
        ])
    }).then(function (user) {
        var message = 'El usuario "' + req.user.nombres + '" ya había registrado salida. '
        if(user){
            message = '¡Descansa ' + req.user.nombres + ', nos vemos mañana!';
        }
        res.json({
            status: 'Ok',
            message: message
        });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error a la hora de registrar la entrada'
        });
    });
});

/*
* Cancelar nota
 */
router.post('/cancel/note', isAuthenticated,function(req, res){
    db.tx(function(t){
        return t.batch([
            t.manyOrNone('select * from venta_articulos where id_venta = $1 ',[
            numericCol(req.body.note_id)
        ]),
            t.one('update ventas set estatus = $2 where id = $1 returning id', [req.body.note_id, "cancelada"])
        ]).then(function( articulos ){
            var queries = [];
            for(var i = 0; i < articulos[0].length; i++){
                queries.push(
                    t.one('update articulos set n_existencias = n_existencias + $2 where id = $1 returning id, id_proveedor, costo', [
                    articulos[0][i].id_articulo,
                    articulos[0][i].unidades_vendidas
                ])
                );
            }
            queries.push(articulos[0]);
            return t.batch(queries); // Aquí no puedo accesar viewjo
        }).then(function( data ){
            var proveedores = [];
            for(var i = 0; i < (data.length - 1); i++){
                proveedores.push(
                    t.one('update proveedores set a_cuenta = a_cuenta - $2, por_pagar = por_pagar + $2 where id = $1 returning id', [
                        numericCol(data[i].id_proveedor),
                        numericCol(data[i].costo) * numericCol(data[data.length - 1][i].unidades_vendidas)
                    ])
                )
            }
            return t.batch(proveedores);
        });
    }).then(function(data){
        console.log('Nota cancelada: ',data);
            res.json({
                status: 'Ok',
                message: 'Se ha cancelado la nota'
            });
    }).catch(function(error){
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al cancelar la nota'
        });
    });
});


/*
 * Actualización de usuario
 */
router.post('/user/update', isAuthenticated, function(req, res){
    db.one('update usuarios set nombres=$2, apellido_paterno=$3, apellido_materno=$4, rfc=$5, direccion_calle=$6, direccion_numero_int=$7, ' +
        'direccion_numero_ext=$8, direccion_colonia=$9, direccion_localidad=$10, direccion_municipio=$11, direccion_ciudad=$12, direccion_estado= $13,' +
        'direccion_pais=$14, email=$15, id_tienda=$16, salario=$17, empleado=$18, permiso_tablero=$19, permiso_administrador=$20, permiso_empleados=$21, permiso_inventario=$22 ' +
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
        req.body.direccion_estado,
        req.body.direccion_pais,
        req.body.email,
        numericCol(req.body.id_tienda),
        numericCol(req.body.salario),
        stob(req.body.empleado),
        stob(req.body.permiso_tablero),
        stob(req.body.permiso_administrador),
        stob(req.body.permiso_empleados),
        stob(req.body.permiso_inventario)
        //req.body.llegada,
        //req.body.salida
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

router.post('/reports/', isAuthenticated, function (req, res) {
   res.render('partials/reports');
});

router.post('/item/find-items-view', isAuthenticated, function (req, res) {

    db.task(function (t) {
        return this.batch([
            this.manyOrNone('select id, nombre from proveedores'),
            this.manyOrNone('select * from marcas')
        ]);
    }).then(function (data) {
        res.render('partials/find-items',{
            proveedores: data[0],
            marcas: data[1]
        });
    }).catch(function (error) {
        console.log(error);
    });

});



router.post('/search/items/results', isAuthenticated, function (req, res) {
    console.log(req.body);
    //var pageSize = 10;
    //var offset = req.body.page * pageSize;
    db.task(function (t) {
        return this.batch([
            t.manyOrNone("select * from articulos where id_proveedor = $1 and id_marca = $2 and articulo ilike '%$3#%' and modelo ilike '%$4#%' "/*and n_existencias > 0"*/, [
                req.body.id_proveedor,
                req.body.id_marca,
                req.body.articulo,
                req.body.modelo
            ]),
            t.oneOrNone('select * from usuarios where id = $1', [ req.user.id ]),
            t.manyOrNone('select * from terminales')
        ])
    }).then(function (data) {
        res.render('partials/search-items-results',{
            items: data[0],
            user: data[1],
            terminales: data[2],
            //not_in_carrito: data[3]
        });
    }).catch(function (error) {
        console.log(error);
    });

});

router.post('/search/items/devs', function (req, res) {
    console.log(req.body);
    //var pageSize = 10;
    //var offset = req.body.page * pageSize;
    db.manyOrNone("select * from ventas, venta_articulos, articulos where ventas.id = venta_articulos.id_venta and venta_articulos.id_articulo = articulos.id and ( ventas.id = $1 or " +
                " (fecha_venta > $2 and fecha_venta < $3)) ", [
                numericCol(req.body.id_nota),
                req.body.fecha_inicial,
                req.body.fecha_final
            ]).then(function (data) {
        res.render('partials/find-item-dev',{
            items: data[0],
            user: data[1],
            terminales: data[2],
            //not_in_carrito: data[3]
        });
    }).catch(function (error) {
        console.log(error);
    });

});

router.post('/employees/find-employees-view', function (req, res) {
    res.render('partials/find-employees');
});

router.post('/notes/find-notes-view', function (req, res) {
    db.task(function (t) {
        return this.batch([
            this.manyOrNone('select id, nombre from proveedores'),
            this.manyOrNone('select * from marcas')
        ]);
    }).then(function (data) {
        res.render('partials/find-notes',{
            proveedores: data[0],
            marcas: data[1]
        });
    }).catch(function (error) {
        console.log(error);
    });
});

router.post('/employee/details', function (req, res) {
    console.log(req.body);
    var id = req.body.id;
    db.task(function (t) {
        return this.batch([
            this.oneOrNone('select * from usuarios where id = $1', id),
            this.manyOrNone('select * from asistencia where id_usuario = $1', id),
            this.manyOrNone('select * from prestamos where id_usuario = $1', id),
            this.manyOrNone('select * from ventas where id_usuario = $1', id),
            this.oneOrNone('select * from tiendas, usuarios where tiendas.id = usuarios.id_tienda and usuarios.id = $1', id),
        ]);
    }).then(function (data) {
        res.render('partials/employee-detail',{
            usuario: data[0],
            asistencias: data[1],
            prestamos:data[2],
            ventas: data[3],
            tienda: data[4]
        });
    }).catch(function (error) {
        console.log(error);
    });
});

router.post('/search/employees/results', function (req, res) {
    console.log(req.body);
    db.manyOrNone("select * from usuarios where nombres ilike '%$1#%' or apellido_paterno ilike '%$2#%' or apellido_materno ilike '%$3#%'", [
        req.body.nombres,
        req.body.apellido_paterno,
        req.body.apellido_materno
    ]).then(function (data) {
        res.render('partials/search-employees-results',{
            employees: data
        });
    }).catch(function (error) {
        console.log(error);
    });
});

router.post('/search/notes/results', function (req, res) {
    db.manyOrNone("select * from ventas where (fecha_venta >= $2 and fecha_venta <= $3)", [
        numericCol(req.body.id_nota),
        req.body.fecha_inicial,
        req.body.fecha_final
    ]).then(function (data) {
        res.render('partials/search-notes-results',{
            sales: data
        });
    }).catch(function (error) {
        console.log(error);
    });
});

router.get('/item/:filename/image.jpg', isAuthenticated, function (req, res) {
   res.sendFile( path.resolve('../uploads/'+req.params.filename));
});

//eventos del calendario
router.post('/calendar/sales/', isAuthenticated, function (req, res ){
   db.manyOrNone("select concat ( 'Ventas: ', count(*) ) as title, to_char(fecha_venta, 'YYYY-MM-DD') as start from ventas group by fecha_venta").then(function (data) {
       res.json( data );
   }).catch(function (error) {
       console.log(error);
   });
});


/* Borrado */
router.post('/user/delete', function (req, res ) {
    db.one('delete from usuarios cascade where id = $1 returning id ', [ req.body.id ]).then(function (data) {
        console.log('Usuario eliminado: ', data.id );
        res.json({
            status: 'Ok',
            message: 'El usuario ha sido eliminado del sistema'
        })
    }). catch(function (error) {
        console.log(error);
        res.json({
            status : 'Error',
            message: 'Ocurrió un error al borrar el usuario'
        })
    });
});


router.post('/store/delete', function(req, res){
   db.one('delete from tiendas cascade where id = $1 returning id',[ req.body.id ]).then(function(data){
       console.log('Tienda eliminada: ', data.id );
       res.json({
           status : 'Ok',
           message : 'La tienda ha sido eliminada del sistema'
       });
   }).catch(function (error) {
       console.log(error);
       res.json({
           status :'Error',
           message: 'Ocurrió un error al eliminar la tienda'
       })
   })
});


router.post('/terminal/delete', function (req, res) {
   db.one('delete from terminales cascade where id = $1 returning id ', [ req.body.id  ]).then(function (data) {
       console.log('Terminal eliminada: ', data.id );
       res.json({
           status : 'Ok',
           message: 'Terminal eliminada'
       });
   }).catch(function (error) {
       console.log(error);
       res.json({
           status: 'Error',
           message: 'Ocurrió un error al eliminar la terminal'
       });
   });
});


router.post('/supplier/delete', function (req, res) {
    db.one('delete from proveedores cascade where id = $1 returning id', [ req.body.id ]).then(function (data) {
        console.log('Proveedor eliminado: ', data.id );
        res.json({
            status : 'Ok',
            message : 'El proveedor fue eliminado del sistema'
        });
    }).catch(function (error) {
        console.log(error);
        res.json({
            status: 'Error',
            message: 'Ocurrió un error al eliminar el proveedor'
        });
    });
});

module.exports = router;