
$('#genericModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var modal = $(this);

    switch (button.data('action')) {
        //import data from csv files
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
            modal.find('#modal_content').load('/item/new', {   }, function(){
                //
            });
            break;
    }
});

