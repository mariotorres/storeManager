$.fn.modal.prototype.constructor.Constructor.DEFAULTS.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.DEFAULTS.keyboard = false;

function modalEvents(button, modal, page ) {
    switch (button.data('action')) {
        case "new_user":
            modal.find('.modal-title').text('Registrar usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/new', { user_id: button.data('user_id')  }, function(){

            });
            break;
        case "user_profile":
            modal.find('.modal-title').text('Editar información del usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/profile', { user_id: button.data('user_id')  }, function(){
                $('#form_updateprofile').submit(function(event){
                    $.post('/user/update', $(this).serialize()).done(function (data) {
                        alert(data.message);
                        if (data.status=='Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "change_password":
            modal.find('.modal-title').text('Cambiar contraseña');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/change-password', { user_id: button.data('user_id')  }, function(){
                $('#form_updatepassword').submit(function (event) {
                    $.post('/user/update-password', $(this).serialize()).done(function (data) {
                        alert(data.message);
                        if(data.status=='Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "new_item":
            modal.find('.modal-title').text('Registrar artículo');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/new', {}, function(){
                $('#itemForm').submit(function(event) {
                    var n_articles = $('input[id=nArts]').val();
                    if (confirm("¿Está seguro que quiere registrar " + n_articles + " artículos?")){
                            $.post('/item/register', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if (data.status == 'Ok') {
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                }
                })
            });
            break;
        case "edit_item":
            modal.find('.modal-title').text('Editar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    // alert("Funciona, item: "+ $(this).data('item_id'));
                    $("#modal_content").load('/item/edit-item/',{ id: $(this).data('item_id') }, function () {
                        $('#itemForm').submit(function (event) {
                            $.post('/item/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });
                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;
        // Editar articulos
        case "edit_user":
            modal.find('.modal-title').text('Editar usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    // alert("Funciona, item: "+ $(this).data('item_id'));
                    $("#modal_content").load('/user/edit-user/',{ id: $(this).data('user_id') }, function () {
                        $('#updateUser').submit(function (event) {
                            $.post('/user/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });
                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;
        //stores
        case "new_store":
            modal.find('.modal-title').text('Registrar sucursal');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/store/new', { /* post body data */ }, function(){
                $('#storeForm').submit(function(event){
                    $.post('/store/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        //terminals
        case "new_terminal":
            modal.find('.modal-title').text('Registrar terminal');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/terminal/new', { /* post body data */ }, function(){
                $('#terminalForm').submit(function(event){
                    $.post('/terminal/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "edit_terminal":
            modal.find('.modal-title').text('Editar terminal');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/terminal/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/terminal/edit-terminal/', {id: $(this).data('terminal_id')}, function () {
                        $('#terminalForm').submit(function (event) {
                            $.post('/terminal/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });
                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;
        case "edit_store":
            modal.find('.modal-title').text('Editar sucursal');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/store/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/store/edit-store/', {id: $(this).data('store_id')}, function () {
                        $('#storeForm').submit(function (event) {
                            $.post('/store/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });
                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;
        case "new_sale":
            modal.find('.modal-title').text('Registrar venta');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/list/sale',{ page: page},function(){
                var select = $('input[name=id]').data('user_id');
                $(this).find('.list-group-item').click(function(){
                    if (confirm("¿Está seguro que quiere vender el artículo: " +  $(this).data('item_id'))){
                        // Selected discount
                        $.post('/carrito/new', {item_id:$(this).data('item_id'), user_id:select, desc:$('input[name=optradioDesc]:checked').val(),
                            terminal_id:document.getElementById("terminales").options[document.getElementById("terminales").selectedIndex].value,
                            pago_efectivo: $('input[name=optradioPago]:checked').val() == 1}).done(function (data) {
                            alert(data.message);
                            if(data.status=='Ok'){
                                modal.modal('hide');
                            }
                        });
                        event.preventDefault();
                    }
                });
            });
            break;
        case "new_supplier":
            modal.find('.modal-title').text('Registrar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/supplier/new', { /* post body data */ }, function(){
                $('#supplierForm').submit(function(event){
                    $.post('/supplier/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "edit_supplier":
            modal.find('.modal-title').text('Editar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/supplier/list/', { page : page } , function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load("/supplier/edit-supplier/", {id: $(this).data('supplier_id')}, function(){
                        $('#supplierForm').submit(function (event) {
                            $.post('/supplier/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });

                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;

        case "reports":
            modal.find('.modal-title').text('Editar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/reports',{},function(){

            });
            break;
        // brands
        case "new_brand":
            modal.find('.modal-title').text('Registrar marca');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/brand/new', { /* post body data */ }, function(){
                $('#brandForm').submit(function(event){
                    $.post('/brand/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "edit_brand":
            modal.find('.modal-title').text('Editar marca');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/marca/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/brand/edit-brand/', {id: $(this).data('marca_id')}, function () {
                        $('#brandForm').submit(function (event) {
                            $.post('/brand/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            event.preventDefault();
                        });
                    });
                });
                $('.pagination').find('li').click(function () {
                    modalEvents(button, modal, $(this).data('pagenumber'));
                });
            });
            break;
    }
}

$('#genericModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var modal = $(this);

    var page = 0;
    modalEvents(button, modal, page);
});
/*
$('#genericModal').modal({
    backdrop: 'static',
    keyboard: false
});
*/