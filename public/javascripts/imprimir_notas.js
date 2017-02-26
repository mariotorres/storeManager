// remove from list
$('button[name=remove-note]').click(function () {

    var message ='<b>¿Está seguro de eliminar la nota?</b>';
    if (confirm( message)){
        alert('Eliminando nota de la lista');
    }

});


//imprimir
$('button[name=print-notes]').click(function () {
    alert('Imprimiendo lista');
});
