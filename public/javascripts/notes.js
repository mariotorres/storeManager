
// Guardar monto en botno
$('input[name=abono]').change(function(){
    var monto_pagar = $(this).data('monto_pagar');
    if($(this).val() > monto_pagar){
        alert("El monto a abonar no puede ser mayor al monto por pagar");
        $(this).val(monto_pagar);
    }else {
        $('button[name=abonar]').val($(this).val());
    }
    if($(this).val() > 0){
        $('button[name=abonar]').removeAttr('disabled');
    }else{
        alert("El monto a abonar debe ser mayor o igual a cero");
        $('button[name=abonar]').attr('disabled','disabled');
        $(this).val(monto_pagar);
    }
})

// Actualizar montos
$('button[name=abonar]').click(function(){
    var monto_pagar = $(this).data('monto_pagar');
    var abono       = $(this).val() === null? 0: $(this).val();
    if(abono <= monto_pagar && abono > 0) {
        var id_item  = $(this).data('item_id');
        var id_venta = $(this).data('sale_id');
        $.post('/notes/abono',{
            item_id: id_item,
            sale_id: id_venta,
            abono: abono
        }).done(function (data) {
            alert(data.message);
            if (data.status == 'Ok') {
                location.reload();
            }
        })
    }else if (abono <= 0){
        alert("El monto a abonar debe ser mayor a cero.");
    }else{
        alert("El monto a abonar no puede ser mayor al monto por pagar.");
    }
});
