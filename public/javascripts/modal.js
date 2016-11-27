
$('#genericModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var modal = $(this);

    switch (button.data('action')) {
        case "new_user":
            modal.find('.modal-title').text('Registrar proveedor');
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
                $('#itemForm').submit(function(event){
                    $.post('/item/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                })
            });
            break;
        case "edit_item":
            modal.find('.modal-title').text('Editar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/list/0', function(){
                $(this).find('.list-group-item').click(function(){
                   // alert("Funciona, item: "+ $(this).data('item_id'));
                    $(this).parent().load('/item/edit-item/',{ id: $(this).data('item_id') });
                })
            });
            break;
            //stores
        case "new_store":
            modal.find('.modal-title').text('Registrar sucursal');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/store/new', {}, function(){
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
            modal.find('#modal_content').load('/store/list/0', function(){
                $(this).find('.list-group-item').click(function(){
                    $(this).parent().load('/store/edit-store/', {id: $(this).data('store_id')})
                });
        });
            break;
        case "new_supplier":
            modal.find('.modal-title').text('Registrar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/supplier/new', {}, function(){
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
            modal.find('#modal_content').load('/supplier/new', {}, function(){

            });
            break;
    }
});

