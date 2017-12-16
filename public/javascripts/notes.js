// Actualizar montos
/*
$('button[name=abonar]').click(function(){
    var monto_abonar = $('input[name=monto_abonar]').val();
    var id_venta     = $('input[name=id]').val();
    var tipo_pago    = $('input[name=optradio]:checked').val()
    var estatus      = $('select[name=estatus]')
    var id_arts      = $('input[name=id_articulo]')
    var terminal     = $('select[name=terminal]').find(':selected').val()
    var hora         = $('input[name=hora_venta]').val()
    var fecha        = $('input[name=fecha_venta]').val()
    var estats       = ''
    var ids          = ''
    for(var i = 0; i < estatus.length; i++){
        estats = estats + '|' + estatus[i].value
        ids    = ids    + '|' + id_arts[i].value
    }
    // Post
    $.post('/notes/abono',{
        monto_abonar: monto_abonar,
        id_venta: id_venta,
        forma_pago: tipo_pago,
        estatus: estats,
        ids_arts: ids,
        terminal: terminal,
        fecha: fecha,
        hora: hora
    }).done(function (data) {
        alert(data.message);
        if (data.status == 'Ok') {
            location.reload();
        }
    })
});
*/
