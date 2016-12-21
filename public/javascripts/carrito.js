
$('.btn').click(function () {
    var button = $(this);

    //Código para quitar un artículo del carrito
    if ( button.data('action') == 'rm_item') {
        if (confirm('¿Seguro que quieres quitar el artículo del carrito?') ) {
            $.post('/carrito/rem', {
                user_id: $("#rem").data('user_id'),
                item_id: $("#rem").data('item_id')
            }).done(function (data) {
                alert(data.message);
                if (data.status == 'Ok') {
                    // Código que elimina la ficha del producto eliminado
                    // boton -> panel-body -> panel
                    button.parent().parent().remove();
                }
            });
        }
    }

});

