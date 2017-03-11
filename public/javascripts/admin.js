$('#downloadsales').click(function () {
    if (confirm('¿Desea exportar la lista de proveedores?')){
        window.location.href = '/exportar/ventas.csv';
    }
});
