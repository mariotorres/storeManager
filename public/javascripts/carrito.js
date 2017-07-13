//Código de los botones del carrito

$('body').find('form').submit(function (e) {
    var button = $(this);
    var modal  = $("#genericModal");
    modal.find('.modal-title').text('Seleccionar tipo de pago');
    modal.find('#modal_content').html("");
    modal.find('#modal_content').load('/type/payment', { /*page:1*/ }, function(){
        $('#sale_datepicker1').datetimepicker({
            format: 'YYYY-MM-DD',
            defaultDate: new Date().setDate(new Date().getDate( ))
        });
        $('#sale_timepicker1').datetimepicker({
            format: 'LT'
        });
        modal.find('form').submit(function(event){
            $.post('/carrito/sell', $(this).serialize()).done(function (data) {
                alert(data.message);
                if(data.status=='Ok'){
                    //alert("Venta exitosa");
                    location.reload();
                }
            });
            event.preventDefault();
        });
    });
    modal.modal("show");
    e.preventDefault();
});

// Actualizar montos
$('input[name=monto_pagado]').change(function(){
    var monto = $(this).val();
    var id    = $(this).data('item_id');
    $.post('/carrito/monto',{
        item_id: id,
        monto: monto
    }).done(function (data) {
        if (data.status == 'Ok') {
            location.reload();
            // Obtener HTML del carrito
        }
    })
});

// Actualizar status
$("select[name=estatus]").change(function(){
    var status = $(this).find('option:selected').val();
    var id     = $(this).data('item_id')
    $.post('/carrito/status',{
        item_id: id,
        status: status
    }).done(function(data){
        if(data.status == 'Ok'){
        }
    })
})


$('.fa').click(function(){
    var button = $(this);
   switch(button.data('action')){
       case 'rem_item':
           if (confirm('¿Seguro que quieres quitar el artículo: ' +  button.data('item_name') + ' del carrito?') ) {
               $.post('/carrito/rem', {
                   user_id: button.data('user_id'),
                   item_id: button.data('item_id'),
                   estatus: button.data('estatus')
               }).done(function (data) {
                   alert(data.message);
                   if (data.status == 'Ok') {
                       // Obtener HTML del carrito
                       location.reload();
                   }
               });
           }
           break;
       case 'inc_item':
           $.post('/carrito/inc', {
               user_id: button.data('user_id'),
               item_id: button.data('item_id'),
               estatus: document.getElementById('estatus').value
           }).done(function (data) {
               alert(data.message);
               if (data.status == 'Ok') {
                   // Obtener HTML del carrito
                   location.reload();
               }
           });
           break;
       case 'dec_item':
           $.post('/carrito/dec', {
               user_id: button.data('user_id'),
               item_id: button.data('item_id'),
               estatus: document.getElementById('estatus').value
           }).done(function (data) {
               alert(data.message);
               if (data.status == 'Ok') {
                   // Obtener HTML del carrito
                   location.reload();
               }
           });
           break;
       default:
   }

});