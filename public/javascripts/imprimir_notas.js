// remove from list
$('button[name=remove-note]').click(function () {

    var message ='¿Está seguro de eliminar la nota?';
    if (confirm( message)){
        $.post('/notas/imprimir/remover', {id_venta: $(this).data('id_venta')}).done(function (data) {
            alert(data.message);
            if (data.status== 'Ok'){
                location.reload();
            }
        });
    }
});


//imprimir
$('button[name=print-notes]').click(function () {
    alert('Imprimiendo lista');
});
