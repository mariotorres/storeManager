
$('.btn').click(function () {
    var button = $(this);

    //Código para quitar un artículo del carrito
    if ( button.data('action') == 'rm_item') {
        if (confirm('¿Seguro que quieres quitar el artículo del carrito?') ) {
            $.post('/carrito/rem', {
                user_id: button.data('user_id'),
                item_id: button.data('item_id')
            }).done(function (data) {
                alert(data.message);
                if (data.status == 'Ok') {
                    // Obtener HTML del carrito
                }
            });
        }
    }

});

