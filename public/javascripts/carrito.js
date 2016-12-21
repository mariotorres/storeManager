
$('.btn').click(function () {
    var button = $(this);

    switch ( button.data('action') ){
        case 'rm_item':
            //Código para quitar un artículo del carrito
            if (confirm('¿Seguro que quieres quitar el artículo del carrito?') ) {
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
        case "make_sale":
            //Confirmar venta
            if (confirm("¿Está seguro que quiere realizar la venta?")){
                // Selected discount
                $.post('/carrito/sell', {}).done(function (data) {
                    alert(data.message);
                    if(data.status=='Ok'){
                        //¿?
                    }
                });
            }
            break;
    }
});

