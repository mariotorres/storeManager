//Código de los botones del carrito
$('.btn').click(function () {
    var button = $(this);
    if (confirm("¿Está seguro que quiere realizar la venta?")){
        // Selected discount
        $.post('/carrito/sell', {}).done(function (data) {
            alert(data.message);
            if(data.status=='Ok'){
                //¿?
            }
        });
    }
});

$('.fa').click(function(){
    var button = $(this);
   switch(button.data('action')){
       case 'rem_item':
           if (confirm('¿Seguro que quieres quitar el artículo: ' +  button.data('item_name') + ' del carrito?') ) {
               $.post('/carrito/rem', {
                   user_id: button.data('user_id'),
                   item_id: button.data('item_id')
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
               item_id: button.data('item_id')
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
               item_id: button.data('item_id')
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

/*
$('#inc').click(function(){
    var button = $(this);
    //Código para quitar un artículo del carrito
    $.post('/carrito/inc', {
        user_id: button.data('user_id'),
        item_id: button.data('item_id')
    }).done(function (data) {
        alert(data.message);
        if (data.status == 'Ok') {
            // Obtener HTML del carrito
            location.reload();
        }
    });
});

$('#dec').click(function(){
    var button = $(this);
    //Código para quitar un artículo del carrito
    $.post('/carrito/dec', {
        user_id: button.data('user_id'),
        item_id: button.data('item_id')
    }).done(function (data) {
        alert(data.message);
        if (data.status == 'Ok') {
            // Obtener HTML del carrito
            location.reload();
        }
    });
});

$('#rem').click(function(){
    var button = $(this);
    //Código para quitar un artículo del carrito
    if (confirm('¿Seguro que quieres quitar el artículo: ' +  button.data('item_name') + ' del carrito?') ) {
        $.post('/carrito/rem', {
            user_id: button.data('user_id'),
            item_id: button.data('item_id')
        }).done(function (data) {
            alert(data.message);
            if (data.status == 'Ok') {
                // Obtener HTML del carrito
                location.reload();
            }
        });
    }
});
*/
