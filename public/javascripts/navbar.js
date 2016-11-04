
$('#genericModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var modal = $(this);

    switch (button.data('action')) {
        //import data from csv files
        case "user_profile":
            modal.find('.modal-title').text('Editar información del usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/users/profile', { user_id: button.data('user_id')  }, function(){
                $('#form_updateprofile').submit(function(event){
                    $.post('/users/update', $(this).serialize()).done(function (data) {
                        alert(data.message);
                        if (data.status=='Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
                $('#form_updatepassword').submit(function (event) {
                   $.post('/users/password', $(this).serialize()).done(function (data) {
                        alert(data);
                       if(data.status=='Ok'){
                           modal.modal('hide');
                       }
                   });
                });
            });
            break;
    }
});

$(document).ready(function () {
});