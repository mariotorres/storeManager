$.fn.modal.prototype.constructor.Constructor.DEFAULTS.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.DEFAULTS.keyboard = false;

function modalEvents(button, modal, page ) {
    switch (button.data('action')) {
        case "new_user":
            modal.find('.modal-title').text('Registrar usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/new', { }, function(){
                $('#timepicker1, #timepicker2').datetimepicker({
                    format: 'LT'
                });

                modal.find('form').submit(function (e) {
                    $.post('/user/signup/', $(this).serializeArray()).done(function (data) {
                        alert(data.message);
                        if (data.status== 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    e.preventDefault();
                });
            });
            break;
        case "user_profile":
            modal.find('.modal-title').text('Editar información del usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/profile', { user_id: button.data('user_id')  }, function(){
                modal.find('form').submit(function(event){
                    $.post('/user/update', $(this).serialize()).done(function (data) {
                        alert(data.message);
                        if (data.status=='Ok'){
                            modal.modal('hide');
                            location.reload();
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
                modal.find('form').submit(function (event) {
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

                var ButtonValue;

                $('button[type="submit"]').click(function(e){
                    ButtonValue = $(this).val();
                });

                modal.find('form').submit(function (e) {
                    var formData = new FormData();

                    var arr = $(this).serializeArray();

                    for ( var i =0; i < arr.length ; i++){
                        formData.append(arr[i].name, arr[i].value);
                    }

                    var img = document.getElementById('imagen');
                    formData.append('imagen', img.files[0] );

                    // alert(ButtonValue);
                    // --------------------------------------------------------
                    if (confirm("¿Está seguro que quiere registrar " + $('#nArts').val() + " artículos?")) {
                        $.ajax({
                            url: '/item/register',
                            data: formData,
                            cache: false,
                            contentType: false,
                            processData: false,
                            type: 'POST',
                            success: function (data) {
                                alert(data.message);
                                if (data)
                                if (data.status == 'Ok') {
                                    if(ButtonValue == 'registrar') {
                                        modal.modal('hide');
                                    }else{
                                        modal.find('form').trigger('reset')
                                    }
                                }
                            }
                        });
                    }
                    // --------------------------------------------------------


                    e.preventDefault();
                });
            });
            break;
        case "back_item_sol":
            modal.find('.modal-title').text('Devolución de artículos solicitados');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-view-sol-prov', {page: page}, function(){
                modal.find('form').submit(function(e) {
                    modal.find('#search_results').load('/search/items/results_sols', $(this).serializeArray(), function(){
                        modal.find('form').submit(function(e) {
                            $.post('/item/return_sols', $(this).serializeArray()).done(function(data){
                                alert(data.message);
                                if(data.status == 'Ok'){
                                    modal.modal('hide')
                                }
                            })
                            e.preventDefault();
                        })
                    })
                    e.preventDefault();
                })
            })
            break;
        case "back_item":
            modal.find('.modal-title').text('Devolución de artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-view',{ page: page }, function(){ // change /item/list
                // ------------------------------------------------------
                modal.find('form').submit(function (e) {
                    // Mostrar resultados
                    modal.find('#search_results').load('/search/items/results_inv', $(this).serializeArray(), function () {//mod
                        $('#search_results').find('button[name=go_search]').click(function () {
                            modal.find('#modal_content').load('/item/return-item', {id:$(this).data('item_id')}, function() {
                                modal.find('form').submit(function(event){
                                  $.post('/item/return', $(this).serializeArray()).done(function(data){
                                    alert(data.message);
                                    if(data.status == 'Ok'){
                                        modal.modal('hide')
                                    }
                                  });
                                  event.preventDefault();
                                })
                            })
                        })
                    })
                    e.preventDefault();
                })
                /*
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/item/return-item/',{ id: $(this).data('item_id') }, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/item/return', $(this).serialize()).done(function (data) {
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
                */
            });
            break;
        case "edit_item":
            modal.find('.modal-title').text('Editar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/list/',{ page: page }, function(){ // mod
                $(this).find('.list-group-item').click(function(){
                    // alert("Funciona, item: "+ $(this).data('item_id'));
                    $("#modal_content").load('/item/edit-item/',{ id: $(this).data('item_id') }, function () {

                        $('#deleteitem').click(function () {
                           if (confirm('¿Está seguro de eliminar el artículo?')){
                               $.post('/item/delete', { id : $(this).data('id')}).done(function (data) {
                                   alert(data.message);
                                   if (data.status ==='Ok'){
                                       modal.modal('hide');
                                   }
                               });
                           }
                        });

                        modal.find('form').submit(function (event) {

                            var formData = new FormData();
                            var arr = $(this).serializeArray();

                            for ( var i =0; i < arr.length ; i++){
                                formData.append(arr[i].name, arr[i].value);
                            }

                            var img = document.getElementById('imagen');
                            formData.append('imagen', img.files[0] );
                            $.ajax({
                                url: '/item/update',
                                data: formData,
                                cache: false,
                                contentType: false,
                                processData: false,
                                type: 'POST',
                                success: function (data) {
                                    alert(data.message);
                                    if (data)
                                        if (data.status === 'Ok') {
                                            modal.modal('hide');
                                        }
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
        case "find_supplier":
            modal.find('.modal-title').text('Buscar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/suppliers/find-suppliers-view', {}, function(){
                $('#suppliers_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#suppliers_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ))
                });
                modal.find('#findSuppliers').submit(function(e){
                    modal.find('#modal_content').load('/supplier/details', $(this).serializeArray(), function(){

                    });

                    /*modal.find('#search_results').load('/search/suppliers/results', $(this).serializeArray(), function(){
                        $('#search_results').find('.list-group-item').click(function(){

                        });
                    });
                    */
                    e.preventDefault();
                });
            });
            break;
        case "find_employee":
            modal.find('.modal-title').text('Buscar empleado');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/find-employees-view',{}, function () {
                modal.find('#findEmployees').submit(function (e) {
                    modal.find('#search_results').load('/search/employees/results', $(this).serializeArray(), function () {
                        /*$('#search_results').find('#findEmployees').submit(function(e){
                            $.post('/employee/details', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            });
                            e.preventDefault();
                        })*/
                        $('#search_results').find('.list-group-item').click(function () {
                            modal.find('#modal_content').load('/employee/details', { id: $(this).data('user_id') });
                        });
                    });
                    e.preventDefault();
                });
            });
            break;
        case "find_notes":
            // buscar notas para impresión
            modal.find('.modal-title').text('Buscar notas');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/notes/find-notes-view',{}, function () {
                $('#notes_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#notes_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('#find').submit(function (e) {
                    // Mostrar resultados
                    modal.find('#search_results').load('/notes/list/',
                                                       {data: $(this).serializeArray(), page:page}, function () {
                        //poder código para hacer algo con la nota seleccionada
                        $('#search_results').find('.list-group-item').click(function(){
                            modal.find('#modal_content').load('/notes/details', {id: $(this).data('sales_id')}, function(){
                                /*modal.find('form').submit(function(e){

                                })*/
                            })
                        })
                    });
                    e.preventDefault();
                });
            });
            break;
        case "note_payment":
            modal.find('.modal-title').text('Buscar notas');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/notes/find-notes-view',{}, function () {
                $('#notes_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#notes_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('#find').submit(function (e) {
                    // Mostrar resultados
                    modal.find('#search_results').load('/search/notes/results', $(this).serializeArray(), function () {
                        //poder código para hacer algo con la nota seleccionada
                        $('#search_results').find('.list-group-item').click(function () {
                            modal.find('#modal_content').load('/notes/payment',
                                                              { id: $(this).data('user_id'), id_sale:$(this).data('sales_id') },
                                                              function(){
                                                                  $('#sale_datepicker1').datetimepicker({
                                                                      format: 'YYYY-MM-DD',
                                                                      defaultDate: new Date().setDate(new Date().getDate( ))
                                                                  });
                                                                  $('#sale_timepicker1').datetimepicker({
                                                                      format: 'LT'
                                                                  });
                                                                  modal.find('form').submit(function(e){
                                                                      if(buttonIndex == 2){
                                                                          $.post('/notes/update', $(this).serialize()).done(function(data){
                                                                              alert(data.message);
                                                                              if(data.status == 'Ok'){
                                                                                  modal.modal('hide');
                                                                              }
                                                                          })
                                                                      }else if(buttonIndex == 1){
                                                                          $.post('/notes/cancel', $(this).serialize()).done(function(data){
                                                                              alert(data.message);
                                                                              if(data.status == 'Ok'){
                                                                                  modal.modal('hide');
                                                                              }
                                                                          })
                                                                      }else{
                                                                          $.post('/notes/abono', $(this).serialize()).done(function(data){
                                                                              alert(data.message);
                                                                              if(data.status == 'Ok'){
                                                                                  modal.modal('hide');
                                                                              }
                                                                          })
                                                                      }
                                                                      e.preventDefault();
                                                                  })
                                                              });
                        });
                    });
                    e.preventDefault();
                });
            });
      break;
    case "find_item_ninv":
            modal.find('.modal-title').text('Buscar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-ninv-view',{}, function () {//mod
                modal.find('form').submit(function (e) {
                    // Mostrar resultados
                  modal.find('#search_results').load('/search/items/results_ninv',
                                                     $(this).serializeArray()/*params*/, function () {});
                    e.preventDefault();
                });
            });
            break;
        case "find_item_inv":
            modal.find('.modal-title').text('Buscar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-view',{}, function () {//mod
                modal.find('form').submit(function (e) {
                    // Mostrar resultados
                    modal.find('#search_results').load('/search/items/results_inv', $(this).serializeArray()/*params*/, function () {//mod
                            $('#search_results').find('button[name=go_search]').click(function () {
                                modal.find('#modal_content').load('/item/edit-item', {id:$(this).data('item_id')}, function(){
                                    $('#deleteitem').click(function () {
                                        if (confirm('¿Está seguro de eliminar el artículo?')){
                                            $.post('/item/delete', { id : $(this).data('id')}).done(function (data) {
                                                alert(data.message);
                                                if (data.status ==='Ok'){
                                                    modal.modal('hide');
                                                }
                                            });
                                        }
                                    });

                                    modal.find('form').submit(function (event) {
                                        var formData = new FormData();
                                        var arr = $(this).serializeArray();

                                        for ( var i =0; i < arr.length ; i++){
                                            formData.append(arr[i].name, arr[i].value);
                                        }

                                        var img = document.getElementById('imagen');
                                        formData.append('imagen', img.files[0] );
                                        $.ajax({
                                            url: '/item/update',
                                            data: formData,
                                            cache: false,
                                            contentType: false,
                                            processData: false,
                                            type: 'POST',
                                            success: function (data) {
                                                alert(data.message);
                                                if (data)
                                                    if (data.status === 'Ok') {
                                                        modal.modal('hide');
                                                    }
                                            }
                                        });

                                        event.preventDefault();
                                    });
                                });
                            });
                    });
                    e.preventDefault();
                });
            });
            break;
        case "back_item_note":
            modal.find('.modal-title').text('Buscar registros');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/items/list/item_registers', {}, function(){
                $('#registers_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#registers_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('form').submit(function(e){
                    var form_data = $(this).serializeArray()
                    modal.find('#search_results').load('/search/registers/results_back', $(this).serializeArray(), function(){
                        modal.find("#back_note").on('click', function(){
                            $.post('/back/note_item', form_data).done(function(data){
                                alert(data.message);
                                if(data.status=='Ok'){
                                    modal.modal('hide');
                                }
                            })
                        })
                    })
                    e.preventDefault();
                });
            });

            break;
        case "list_back_registers":
            modal.find('.modal-title').text('Buscar registros');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/items/list/back_registers', {}, function(){
                $('#registers_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#registers_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('form').submit(function(e){
                    modal.find('#search_results').load('/search/back/results', $(this).serializeArray(), function(){
                    })
                    e.preventDefault()
                });
            });

            break;
        case "list_item_edits":
            modal.find('.modal-title').text('Buscar registros de ediciones');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/items/list/item_edits', {}, function(){
                $('#registers_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#registers_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('form').submit(function(e){
                    modal.find('#search_results').load('/search/edits/results', $(this).serializeArray(), function(){
                    })
                    e.preventDefault()
                });
            });

            break;
        case "list_item_registers":
            modal.find('.modal-title').text('Buscar registros');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/items/list/item_registers', {}, function(){
                $('#registers_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#registers_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('form').submit(function(e){
                    modal.find('#search_results').load('/search/registers/results', $(this).serializeArray(), function(){
                        modal.find('form').submit(function(e){
                            modal.find('#modal_content').load('/item/registers/edit', $(this).serializeArray(), function(){
                                modal.find('form').submit(function(e){
                                    $.post('/item/registers/update', $(this).serializeArray(), function(data){
                                        alert(data.message);
                                        if(data.estatus == 'Ok'){
                                            modal.modal('hide');
                                        }
                                    })
                                    e.preventDefault();
                                })
                            })
                            e.preventDefault()
                        })
                    })
                    e.preventDefault()
                });
            });

      break;
    case "regis_sol":
            modal.find('.modal-title').text('Buscar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-sol-view',{}, function () {
                modal.find('form').submit(function (e) {
                    modal.find('#search_results').load('/search/items/sol', $(this).serializeArray(), function () {
                        $('#search_results').find('form').submit(function (e) {
                            if (confirm("¿Desea registrar la entrada del artículo " +
                                        $('#search_results').find('input[name=articulo]').val() +
                                        ", con modelo: " +  $('#search_results').find('input[name=modelo]').val())){
                                // Selected discount
                                $.post('/register/sol', $(this).serializeArray()).done(function (data) {
                                    alert(data.message);
                                    if(data.estatus=='Ok'){
                                        modal.modal('hide');
                                    }
                                });
                            }
                            e.preventDefault();
                        });

                    });
                e.preventDefault();
                });
            });
            break;

        case "pay_supplier":
            modal.find('.modal-title').text('Liquidar proveedores');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/supplier/list/pay', {page: page}, function(){
                $('#payment_date').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                var fecha_pago = new Date()
                fecha_pago = fecha_pago.toLocaleDateString()
                fecha_pago = fecha_pago.split('/')
                fecha_pago = fecha_pago[2] + '-' + fecha_pago[0] + '-' + fecha_pago[1]

                var monto_pago = 0

                var concepto = ''
                
                $(this).find('#payment_date').on('dp.change', function(e){
                    fecha_pago = new Date(e.date._d)
                    fecha_pago = fecha_pago.toLocaleDateString()
                    fecha_pago = fecha_pago.split('/')
                    fecha_pago = fecha_pago[2] + '-' + fecha_pago[0] + '-' + fecha_pago[1]
                    console.log(fecha_pago)
                })

                $(this).find('#monto_pago').on('change', function(e){
                    monto_pago = $(this).val()
                })

                $(this).find('#concepto').on('change', function(e){
                    concepto = $(this).val()
                })

                $(this).find('.list-group-item').click(function(){
                    if (confirm("Está seguro de que desea liquidar al proveedor: " + $(this).data('supplier_name'))){
                        $.post('/supplier/payment/', {id: $(this).data('supplier_id'),
                                                      fecha_pago: fecha_pago,
                                                      monto_pago: monto_pago,
                                                      concepto: concepto}).done(function (data) {
                            alert(data.message);
                            if(data.status=='Ok'){
                                modal.modal('hide');
                            }
                        });
                    }
                });
            });
            break;

    case "find_item":
            modal.find('.modal-title').text('Buscar artículos');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/find-items-view',{}, function () {
                modal.find('form').submit(function (e) {
                    // Mostrar resultados
                   // var params = $(this).serializeArray();
                    //params[params.length] = {name:'page', value:page};
                    modal.find('#search_results').load('/search/items/results', $(this).serializeArray(), function () {
                        $('#search_results').find('form').submit(function (e) {
                            if (confirm("¿Desea agregar el artículo " +  $('#search_results').find('input[name=articulo]').val() +
                                        ", con modelo: " +  $('#search_results').find('input[name=modelo]').val() +
                                " al carrito?")){
                                // Selected discount
                                $.post('/carrito/new', $(this).serializeArray()).done(function (data) {
                                    alert(data.message);
                                    if(data.status=='Ok'){
                                        modal.modal('hide');
                                    }
                                });
                            }
                            e.preventDefault();
                        });

                    });
                e.preventDefault();
                });
            });
            break;
        case "new_dev":
            /* ojo con esto */
            modal.find('.modal-title').text('Buscar notas');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/notes/find-notes-view',{}, function () {
                $('#notes_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#notes_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });
                modal.find('#find').submit(function (e) {
                    // Mostrar resultados
                    // /search/items/devs
                    modal.find('#search_results').load('/search/notes/results', $(this).serializeArray(), function () {
                        //poder código para hacer algo con la nota seleccionada
                        $('#search_results').find('.list-group-item').click(function () {
                            modal.find('#modal_content').load('/notes/dev', { id: $(this).data('user_id'), id_sale:$(this).data('sales_id') },
                                function(){
                                    modal.find('form').submit(function(e){
                                        $.post('/notes/finitPayment', $(this).serialize()).done(function(data){
                                            alert(data.message);
                                            if(data.status === 'Ok'){
                                                modal.modal('hide');
                                            }
                                        });
                                        e.preventDefault();
                                    })
                                });
                        });
                    });
                    e.preventDefault();
                });
            });
            break;
            break;
        // Editar usuarios
        case "edit_user":
            modal.find('.modal-title').text('Editar usuario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/user/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/user/edit-user/',{ id: $(this).data('user_id') }, function () {

                        $('#timepicker1, #timepicker2').datetimepicker({
                            format: 'LT'
                        });

                        $('#deleteuser').click(function () {
                            if ( confirm('¿Está seguro de eliminar el usuario?, se eliminarán todos los datos asociados al mismo.') ){
                                $.post( '/user/delete', { id: $(this).data('id') }).done(function (data) {
                                    alert(data.message);
                                    if (data.status === 'Ok'){
                                        modal.modal('hide');
                                    }
                                });
                            }
                        });


                        modal.find('form').submit(function (event) {
                            $.post('/user/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status ==='Ok'){
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
                modal.find('form').submit(function(event){
                    $.post('/store/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status === 'Ok'){
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
                modal.find('form').submit(function(event){
                    $.post('/terminal/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status === 'Ok'){
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

                        $('#deleteterminal').click(function () {
                            if (confirm('¿Está seguro de eliminar la terminal? Se eliminarán todos los datos asociados a ella')){
                                $.post('/terminal/delete',{ id : $(this).data('id')}).done(function (data) {
                                    alert(data.message);
                                    if (data.status === 'Ok'){
                                        modal.modal('hide');
                                    }
                                });
                            }

                        });

                        modal.find('form').submit(function (event) {
                            $.post('/terminal/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status ==='Ok'){
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
                        $('#deletestore').click(function () {
                           if (confirm('¿Está seguro de eliminar la tienda?, se eliminarán todos los datos asociados a ella')){
                               $.post('/store/delete',{ id: $(this).data('id')}).done(function (data) {
                                   alert(data.message);
                                   if ( data.status === 'Ok'){
                                       modal.modal('hide');
                                   }
                               });
                           }
                        });


                        modal.find('form').submit(function (event) {
                            $.post('/store/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status === 'Ok'){
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
            modal.find('.modal-title').text('Agregar productos a carrito');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/item/list/sale',{ page: page},function(){
                $(this).find('form').submit(function( event ){
                    if (confirm("¿Desea agregar el artículo " +  $(this).find('input[name=articulo]').val() +
                            ", con modelo: " +  $(this).find('input[name=modelo]').val() + " al carrito?")){
                        // Selected discount
                        $.post('/carrito/new', $(this).serialize()).done(function (data) {
                            alert(data.message);
                            if(data.status ==='Ok'){
                                modal.modal('hide');
                            }
                        });
                    }
                    event.preventDefault();
                });
            });
            break;
        case "print_notes":
            modal.find('.modal-title').text('Seleccionar notas');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/print/notes/list/',{page: page}, function(){

                $(this).find('form').submit(function(e){
                    if (confirm("¿Está seguro que quiere agregar la nota a la lista de impresión?")){
                        $.post('/notas/imprimir/agregar',  $(this).serializeArray()).done(function (data) {
                            alert(data.message);
                            if(data.status ==='Ok'){
                                modal.modal('hide');
                            }
                        });
                    }
                    e.preventDefault();
                });

                // Descargar pdf de la nota
                $(this).find("button[name='print-note']").click(function () {

                    /*

                    $.get('/notes/getbyid/'+ $(this).data('note_id'),
                        // { id : $(this).data('note_id') },
                        function ( ticket) {
                            var doc = new jsPDF('mm', 'pt', 'A7');

                            // We'll make our own renderer to skip this editor
                            var specialElementHandlers = {
                                '#editor': function (element, renderer) {
                                    return true;
                                }
                            };

                            // All units are in the set measurement for the document
                            // This can be changed to "pt" (points), "mm" (Default), "cm", "in"

                            doc.fromHTML(ticket ,
                                ///*modal.find('.modal-body').get(0),
                                10, 10, {
                                    'width': 200,
                                    //'heigth': 60,
                                    'elementHandlers': specialElementHandlers
                                });

                            doc.save('ticket.pdf');
                        });*/
                    alert($(this).data('id_venta'))
                    window.open('/notes/getbyid/'+ $(this).data('id_venta'));

                });

                //cancelar la nota
                $(this).find("button[name='cancel-note']").click(function () {
                    if (confirm("¿Está seguro que quiere eliminar la nota: " +  $(this).data('id_venta'))){
                        $.post('/cancel/note', {note_id: $(this).data('id_venta')}).done(function (data) {
                            alert(data.message);
                            if(data.status==='Ok'){
                                modal.modal('hide');
                            }
                        });
                    }
                });


            });
            break;
        case "new_supplier":
            modal.find('.modal-title').text('Registrar proveedor');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/supplier/new', { /* post body data */ }, function(){
                modal.find('form').submit(function(event){
                    $.post('/supplier/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status === 'Ok'){
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


                        $('#deletesupplier').click(function () {
                            if (confirm('¿Está seguro de eliminar el proveedor?, se eliminarán todos los datos asociados a el')){
                                $.post('/supplier/delete', {id : $(this).data('id')}).done(function (data) {
                                    alert(data.message);
                                   if (data.status === 'Ok'){
                                       modal.modal('hide');
                                   }
                                });
                            }
                        });

                        modal.find('form').submit(function (event) {
                            $.post('/supplier/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status ==='Ok'){
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
            modal.find('.modal-title').text('Reportes');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/reports',{},function(){



                $('#reports_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date().setDate(new Date().getDate( ) - 1)
                });
                $('#reports_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: new Date()
                });

                modal.find('form').submit(function (e) {
                    window.open('/reporte?'+ $(this).serialize());
                    e.preventDefault();
                });

            });
            break;
        // Extra pay
        case "new_extra_pay":
            modal.find('.modal-title').text('Registrar alteración salario');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/extra_pay/new', {}, function(){
                var today = new Date();
                $('#extra_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: today
                    //defaultDate: (new Date().getDate() - 1)
                });
                modal.find('form').submit(function(event){
                    $.post('/employees/extra_pay/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status === 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        // Lending
        case "new_lending":
            modal.find('.modal-title').text('Registrar préstamo');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/lending/new', {}, function(){
                var today = new Date();
                $('#lending_datepicker1').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: today
                    //defaultDate: (new Date().getDate() - 1)
                });
                $('#lending_datepicker2').datetimepicker({
                    format: 'YYYY-MM-DD',
                    defaultDate: today.setDate(today.getDate() + 7)
                });
                modal.find('form').submit(function(event){
                    $.post('/employees/lending/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        // Bonus
        case "new_bonus":
            modal.find('.modal-title').text('Registrar bono');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/bonus/new', {}, function(){
                modal.find('form').submit(function(event){
                    $.post('/employees/bonus/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        // Prizes
        case "new_prize":
            modal.find('.modal-title').text('Registrar premio');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/prize/new',{},function(){
                modal.find('form').submit(function(event){
                    $.post('/employees/prize/register', $(this).serializeArray()).done(function(data){
                       alert(data.message);
                       if(data.status == 'Ok'){
                           modal.modal('hide');
                       }
                    });
                    event.preventDefault();
                });
            });
            break;
        // Penalizations
        case "new_penalization":
            modal.find('.modal-title').text('Registrar penalización');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employees/penalization/new', { /* post body data */ }, function(){
                modal.find('form').submit(function(event){
                    $.post('/employees/penalization/register', $(this).serialize()).done(function (data){
                        alert(data.message);
                        if(data.status == 'Ok'){
                            modal.modal('hide');
                        }
                    });
                    event.preventDefault();
                });
            });
            break;
        case "edit_bonus":
            modal.find('.modal-title').text('Editar bono');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/bonus/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/bonus/edit-bonus/', {id: $(this).data('bonos_id')}, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/bonus/update', $(this).serialize()).done(function (data) {
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
        case "edit_prize":
            modal.find('.modal-title').text('Editar premio');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/prize/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/prize/edit-prize/', {id: $(this).data('premios_id')}, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/prize/update', $(this).serialize()).done(function (data) {
                                alert(data.message);
                                if(data.status ==='Ok'){
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
        case "edit_lending":
            modal.find('.modal-title').text('Editar préstamo');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/lending/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/lending/edit-lending/', {id: $(this).data('lendings_id')}, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/lendings/update', $(this).serialize()).done(function (data) {
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
        case "edit_extra_pay":
            modal.find('.modal-title').text('Editar pago extra');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/extra-pay/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/extra-pay/edit-extra-pay/', {id: $(this).data('extra_pay_id')}, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/extra-pay/update', $(this).serialize()).done(function (data) {
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
        case "edit_penalization":
            modal.find('.modal-title').text('Editar penalización');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/penalization/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/penalization/edit-penalization/', {id: $(this).data('penalization_id')}, function () {
                        modal.find('form').submit(function (event) {
                            $.post('/penalization/update', $(this).serialize()).done(function (data) {
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
        // brands
        case "new_brand":
            modal.find('.modal-title').text('Registrar marca');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/brand/new', { /* post body data */ }, function(){
                modal.find('form').submit(function(event){
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
        case "check-out":
            modal.find('.modal-title').text('Registrar salida');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employee/list/check-in',{page:page},function(){
                modal.find('form').submit(function(e){
                    modal.find('#search_results').load('/search/employees/checkin', $(this).serializeArray(), function(){
                        $(this).find('.list-group-item').click(function(){
                            $("#modal_content").load('employee/check-out/form/',{id: $(this).data('user_id')}, function(){
                                var today = new Date();
                                $('#timepicker1').datetimepicker({
                                    format: 'LT'
                                });
                                $('#datepicker1').datetimepicker({
                                    format: 'YYYY-MM-DD',
                                    defaultDate: today.setDate(today.getDate())
                                });
                                modal.find('form').submit(function(e){
                                    $.post('/employee/register/check-out',$(this).serializeArray()).done(function(data){
                                        alert(data.message);
                                        if(data.status == 'Ok'){
                                            modal.modal('hide')
                                            location.reload()
                                        }
                                    });
                                    e.preventDefault();
                                })
                            })
                        })
                    });
                    e.preventDefault();
                });
            });
            break;
        case "check-in":
            modal.find('.modal-title').text('Registrar ingreso');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/employee/list/check-in',{page:page},function(){
                modal.find('form').submit(function (e) {
                    modal.find('#search_results').load('/search/employees/checkin', $(this).serializeArray(), function () {
                        $(this).find('.list-group-item').click(function() {
                            $("#modal_content").load('/employee/check-in/form/', {id: $(this).data('user_id')}, function () {
                                var today = new Date();
                                $('#timepicker1').datetimepicker({
                                    format: 'LT'
                                });
                                $('#datepicker1').datetimepicker({
                                    format: 'YYYY-MM-DD',
                                    defaultDate: today.setDate(today.getDate())
                                });
                                modal.find('form').submit(function (e){
                                    $.post('/employee/register/check-in', $(this).serializeArray()).done(function (data){
                                        alert(data.message);
                                        if(data.status == 'Ok'){
                                            modal.modal('hide');
                                            location.reload()
                                        }
                                    });
                                    e.preventDefault();
                                });
                            });
                        });
                    });
                    e.preventDefault();
                });
            });
            break;
        case "edit_brand":
            modal.find('.modal-title').text('Editar marca');
            modal.find('#modal_content').html("");
            modal.find('#modal_content').load('/marca/list/',{ page: page }, function(){
                $(this).find('.list-group-item').click(function(){
                    $("#modal_content").load('/brand/edit-brand/', {id: $(this).data('marca_id')}, function () {

                        $('#deletebrand').click(function () {
                            if (confirm('¿Está seguro de eliminar la marca?')){
                                $.post('/brand/delete', {id: $(this).data('id')}).done(function (data) {

                                    alert(data.message);
                                    if (data.status == 'Ok'){
                                        modal.modal('hide');
                                    }
                                });
                            }
                        });

                        modal.find('form').submit(function (event) {
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


$('#check-in').click(function(){
    $.post('/employee/check-in', {}).done(function (data) {
        alert(data.message);
        if (data.status == 'Ok') {}
    });
});


$('#check-out').click(function(){
    $.post('/employee/check-out', {}).done(function (data) {
        alert(data.message);
        if (data.status == 'Ok') {}
    });
});
