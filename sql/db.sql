/* Usuarios */
drop table if exists usuarios cascade;
create table usuarios (
    id serial primary key,
    usuario text,
    contrasena text,
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
    direccion_pais text
);

/* Niveles de usuario */
drop table if exists sesiones cascade;
create table sesiones (
    id serial primary key,
    tipo text,
    descripcion text
);

insert into sesiones ("tipo","descripcion") values
('Administrador','Administrador del sistema'),
('Vendedor(a)','Vendedor(a)');

/* Permisos de acceso */
drop table if exists sesiones_usuarios;
create table sesiones_usuarios (
    id serial not null,
    id_usuario integer not null references usuarios(id) on delete cascade,
    id_sesion integer not null references sesiones(id) on delete cascade
);

/* Proveedores */
drop table if exists proveedores;
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

/* Inventario */
drop table if exists articulos;
create table articulos (
    id serial primary key,
    articulo text,
    descripcion text,
    talla text,
    notas text,
    precio numeric
);

/* Ventas */
drop table if exists ventas;
create table ventas (
    id serial primary key,
    id_articulo integer,
    precio_venta numeric,
    fecha_venta date,
    hora_venta time
);
