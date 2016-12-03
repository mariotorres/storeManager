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
                var select = $('select[id=vselect]').val();
                //alert("Usuario: "+ select.options[select.selectedIndex].value);
                $(this).find('.list-group-item').click(function(){
                    if (confirm("¿Está seguro que quiere vender el artículo: " +  $(this).data('item_id'))){
                        $.post('/carrito/new', {item_id:$(this).data('item_id'), user_id:select}).done(function (data) {
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
    }
}

$('#genericModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var modal = $(this);
    var page = 0;
    modalEvents(button, modal, page);
});

