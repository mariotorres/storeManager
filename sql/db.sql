drop database if exists business;
create database business;

drop user if exists smuser;
create user smuser with password 'test';

grant all privileges on database business to smuser;

\c business;
set role smuser;

/* Penalizaciones */
drop table if exists penalizaciones cascade;
create table penalizaciones (
    id serial primary key,
    nombre text,
    monto numeric,
    descripcion text,
    dias_retraso integer,  /* Debe reiniciar cada semana.*/
    dias_ausencia integer /* Debe reiniciar cada semana.*/
    );

/* Bonos */
create table bonos (
    id serial primary key,
    nombre text,
    monto numeric,
    descripcion text,
    monto_alcanzar numeric,
    criterio text,
    temporalidad text
    );

/* Tiendas */
drop table if exists tiendas cascade;
create table tiendas (
    id serial primary key,
    nombre text,
    direccion_calle text,
    direccion_numero_int text,
    direccion_numero_ext text,
    direccion_colonia text,
    direccion_localidad text,
    direccion_municipio text,
    direccion_ciudad text,
    direccion_estado text,
    direccion_pais text
);


/* Usuarios */
drop table if exists usuarios cascade;
create table usuarios(
    id serial primary key,
    usuario text,
    contrasena text,
    email text,
    nombres text,
    apellido_paterno text,
    apellido_materno text,
    rfc text,
    direccion_calle text,
    direccion_numero_int text,
    direccion_numero_ext text,
    direccion_colonia text,
    direccion_localidad text,
    direccion_municipio text,
    direccion_ciudad text,
    direccion_estado text,
    direccion_pais text,
    empleado boolean,
    salario numeric,
    permiso_tablero boolean,
    permiso_administrador boolean,
    permiso_empleados boolean,
    permiso_inventario boolean,
    id_tienda integer references tiendas(id),
    hora_llegada time,
    hora_salida time
);

insert into usuarios ("usuario","contrasena","nombres","permiso_tablero","permiso_administrador","permiso_empleados", "permiso_inventario") values
('admin','$2a$10$DmxbjTLBYDdcha8qlXpsaOyUqkJ0BAQ3Q4EIyMtr5HLXm6R0gSvbm','Administrador', true, true, true, true),
('empleado','$2a$10$3NNCPr4qaxS7JjwmTygBLuIXClsDaXVT2HoE40rh2WyEwqLFwLy6m','Empleado', false, false, true, true);

/* prestamos */
drop table if exists prestamos cascade;
create table prestamos (
    id serial primary key,
    id_usuario integer references usuarios(id),
    monto numeric,
    pago_semanal numeric,
    descripcion text,
    fecha_prestamo date,
    fecha_liquidacion date
);

/* prestamos */
drop table if exists asistencia cascade;
create table asistencia (
    id serial primary key,
    id_usuario integer references usuarios(id),
    fecha date,
    hora_llegada time,
    hora_salida time
);



/* Proveedores */
drop table if exists proveedores cascade;
create table proveedores (
    id serial primary key,
    nombre text,
    razon_social text,
    rfc text,
    direccion_calle text,
    direccion_numero_int text,
    direccion_numero_ext text,
    direccion_colonia text,
    direccion_localidad text,
    direccion_municipio text,
    direccion_ciudad text,
    direccion_estado text,
    direccion_pais text,
    a_cuenta  numeric, /* Esta cantidad se registra en el momento en el que se registra una prenda del proveedor*/
    por_pagar numeric  /* Esta cantidad se registra en el momento en el que se vende una prenda del proveedor */
);

drop table if exists marcas cascade;
create table marcas (
id serial primary key,
nombre text,
id_proveedor integer references proveedores(id)
);

/* Inventario */
drop table if exists articulos cascade;
create table articulos (
    id serial primary key,
    id_proveedor integer references proveedores(id),
    id_tienda integer references tiendas(id),
    articulo text,
    descripcion text,
    id_marca integer references marcas(id),
    modelo text,
    talla text,
    notas text,
    precio numeric,
    costo numeric,
    codigo_barras numeric,
    nombre_imagen text,
    n_existencias numeric,
    fecha_registro timestamp,
    fecha_ultima_modificacion timestamp
);


/* terminales */
/*
*  Agregar campos terminales
*/
drop table if exists terminales cascade;
create table terminales(
        id serial primary key,
        id_tienda integer references tiendas(id),
        nombre_facturador varchar(30),
        rfc text
);



/* Carrito */
drop table if exists carrito cascade;
create table carrito (
fecha date,
id_articulo integer references articulos(id),
id_usuario integer references usuarios(id),
discount    numeric,
monto_pagado numeric,
unidades_carrito numeric,
estatus text
);

/* Estatus ventas */
/*drop table if exists estatus_ventas cascade;
create table estatus_ventas (
    id serial primary key,
    estatus text,
    descripcion text
);

insert into estatus_ventas ("estatus","descripcion") values
('Entregado','Se ha cubierto el importe y entregado el artículo'),
('Ajuste','En artículo está en proceso de ajuste');
*/
/* Ventas */
drop table if exists ventas cascade;
create table ventas (
    id serial primary key,
    id_usuario integer references usuarios(id),
    precio_venta numeric,
    fecha_venta date,
    hora_venta time,
    monto_pagado_efectivo numeric,
    monto_cambio numeric,
    monto_pagado_tarjeta  numeric,
    tarjeta_credito  boolean,
    saldo_pendiente numeric,
    id_terminal integer references terminales(id),
    estatus text
);

drop table if exists venta_articulos;
create table venta_articulos(
    id serial primary key,
    id_articulo integer references articulos(id),
    id_venta integer references ventas(id),
    /*id_estatus_venta integer references estatus_ventas(id),*/
    unidades_vendidas numeric,
    discount    numeric,
    monto_pagado numeric,
    monto_por_pagar numeric,
    estatus  text
);

/* Devolución de artículos */
drop table if exists devolucion_prov_articulos;
create table devolucion_prov_articulos(
    id serial primary key,
    id_articulo integer references articulos(id),
    id_proveedor integer references proveedores(id),
    unidades_regresadas numeric,
    fecha date,
    costo_unitario numeric
);



/*
tipo_transaccion
retorno_mercancia
pago_mercancia
*/

/* transacciones */
drop table if exists transacciones;
 create table transacciones(
    id serial primary key,
    id_proveedor integer references proveedores(id),
    id_tipo_transaccion integer,
    notas text,
    monto numeric
    /* ... */
);

/* Operaciones nomina */
drop table if exists operaciones_nomina cascade;
create table operaciones_nomina(
    id serial primary key,
    operacion text
);

insert into operaciones_nomina("operacion") values
('Salario'),('Bono'),('Deducción');

/* Nomina */
drop table if exists nomina;
create table nomina (
    id serial primary key,
    id_usuario integer references usuarios(id),
    id_operacion integer references operaciones_nomina(id),
    monto numeric,
    fecha date,
    hora time
);

/* Asistencia */
drop table if exists asistencia;
create table asistencia(
id serial primary key,
id_usuario integer references usuarios(id),
fecha date,
hora time,
tipo text
);




