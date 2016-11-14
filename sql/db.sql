/* Usuarios */
drop table if exists usuarios cascade;
create table usuarios (
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
    direccion_pais text,
    salario numeric,
    permiso_tablero boolean,
    permiso_administrador boolean,
    permiso_empleados boolean,
    permiso_inventario boolean
);

insert into usuarios ("usuario","contrasena","nombres","permiso_tablero","permiso_administrador","permiso_empleados", "permiso_inventario") values
('admin','$2a$10$DmxbjTLBYDdcha8qlXpsaOyUqkJ0BAQ3Q4EIyMtr5HLXm6R0gSvbm','Administrador', true, true, true, true);

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
    direccion_pais text
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
    direccion_pais text
);

/* Inventario */
drop table if exists articulos cascade;
create table articulos (
    id serial primary key,
    id_proveedor integer references proveedores(id),
    id_tienda integer references tiendas(id),
    articulo text,
    descripcion text,
    marca text,
    modelo text,
    talla text,
    notas text,
    precio numeric,
    codigo_barras numeric,
    url_imagen text
);

/* Carrito */
drop table if exists carrito cascade;
create table carrito (
fecha date,
id_articulo integer references articulo(id)
);

/* Estatus ventas */
drop table if exists estatus_ventas cascade;
create table estatus_ventas (
    id serial primary key,
    estatus text,
    descripcion text
);

insert into estatus_ventas ("estatus","descripcion") values
('Entregado','Se ha cubierto el importe y entregado el artículo'),
('Ajuste','En artículo está en proceso de ajuste');

/* Ventas */
drop table if exists ventas cascade;
create table ventas (
    id serial primary key,
    id_usuario integer references usuarios(id),
    precio_venta numeric,
    monto_pagado numeric,
    forma_pago numeric,
    fecha_venta date,
    hora_venta time,
    id_estatus_venta integer references estatus_ventas(id),
    notas text
);

drop table if exists venta_articulos;
create table venta_articulos(
    id serial primary key,
    id_articulo integer references articulos(id),
    id_venta integer references ventas(id)
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
hora_entrada time,
hora_salida time
);




