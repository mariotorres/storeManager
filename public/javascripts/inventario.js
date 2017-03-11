$('#downloaditems').click(function () {
    if (confirm('¿Desea exportar el inventario?')){
        window.location.href = '/exportar/inventario.csv';
    }
});

$('#downloadsuppliers').click(function () {
    if (confirm('¿Desea exportar la lista de proveedores?')){
        window.location.href = '/exportar/proveedores.csv';
    }
});