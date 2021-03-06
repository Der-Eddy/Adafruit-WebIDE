(function( context_menu, $, undefined ) {
  var is_visible = false;

  var templates = {
    "context_menu":               '<ul class="context-menu">' +
                                  '</ul>',
    "menu_rename":                '<li class="context-menu-rename">' +
                                    '<a href=""><i class="icon-edit"></i> Rename</a>' +
                                  '</li>',
    "menu_delete":                '<li class="context-menu-delete">' +
                                    '<a href=""><i class="icon-remove-sign"></i> Delete</a>' +
                                  '</li>',
    "update_repository":         '<li class="context-menu-update">' +
                                    '<a href=""><i class="icon-refresh"></i> Update Repository</a>' +
                                  '</li>',
    "rename_file_folder":         '<form class="rename-form" id="rename-file-folder-form">' +
                                      '<div class="rename-input-wrapper">' +
                                        '<a class="rename-submit" href="">Save</a>' +
                                        '<input class="file-name" name="file_name" type="text">' +
                                      '</div>' +
                                    '</form>'
  };


  context_menu.init = function() {
    init_events();
  };

  function init_events() {
    $(document).on('contextmenu', '.navigator-item', show_menu);
    $(document).on('mousedown', close_menu);
    $(document).on('mouseenter', '.context-menu', function() {
      $('.context-menu').addClass('hover');
    }).on('mouseleave', '.context-menu', function() {
      $('.context-menu').removeClass('hover');
    });
  }

  function close_menu() {
    if (!$('.context-menu').hasClass('hover')) {
      $('.context-menu').remove();
    }
  }

  function show_menu(event) {
    event.preventDefault();

    var is_adafruit = is_adafruit_repository($(this).data('file').path);

    $(document).off('click', '.context-menu-rename');
    $(document).off('click', '.context-menu-delete');
    $(document).off('click', '.context-menu-update');

    $(".context-menu").remove();

    var $menu = $(templates.context_menu);

    if(!is_adafruit) {
      $menu.append(templates.menu_rename);
      $menu.append(templates.menu_delete);
    }

    if ($('#navigator-folder p').text().indexOf('All Repositories') !== -1) {
      $menu.append(templates.update_repository);
    } else if (is_adafruit) {
      return;
    }

    $menu.appendTo('body');

    $menu.css({'top': event.pageY, 'left': event.pageX - 10});

    // create and show menu
    $(document).on('click', '.context-menu-rename', $.proxy(rename_option, this));
    $(document).on('click', '.context-menu-delete', $.proxy(delete_option, this));
    $(document).on('click', '.context-menu-update', $.proxy(update_repository_option, this));
  }

  function is_adafruit_repository(path) {
    var adafruit_root = "/filesystem/Adafruit-Raspberry-Pi-Python-Code/";
    return (path.indexOf(adafruit_root) !== -1);
  }

  function rename_option(event) {
    event.preventDefault();
    var disable_timeout;
    $(".context-menu").remove();
    var $item = $(this);
    $item.data('old', $item.html());
    var file = $item.data('file');
    //console.log($item.data('file'));

    $item.html(templates.rename_file_folder);
    occEditor.handle_navigator_scroll();
    $('.file-name').val(file.name);
    $('.file-name').focus();

    function disable_rename() {

      disable_timeout = setTimeout(function() {
        disable_listeners();
        $item.html($item.data('old'));
        occEditor.handle_navigator_scroll();
      }, 200);
    }

    function rename_action(event) {
      event.preventDefault();
      disable_listeners();
      clearTimeout(disable_timeout);

      var file = $item.data('file');
      var new_name = $('.file-name').val();
      $('.rename-form').html('Renaming...').css('font-weight', 'bold');

      occEditor.rename(file, new_name);
    }

    function disable_listeners() {
      $(document).off('blur', '.file-name', disable_rename);
      $(document).off('submit', '#rename-file-folder-form', rename_action);
      $(document).off('click', '.rename-submit', rename_action);
    }

    $(document).on('submit', '#rename-file-folder-form', rename_action);
    $(document).on('click touchstart', '.rename-submit', rename_action);
    $(document).on('blur', '.file-name', disable_rename);
  }

  function delete_option(event) {
    event.preventDefault();
    $(".context-menu").remove();

    var socket = occEditor.get_socket();

    var file = $(this).data('file');

    if (file.type === 'directory') {
      davFS.remove(file.path, function(err, status) {
        socket.emit('git-delete', { file: file});
     });
    } else {
      davFS.remove(file.path, function(err, status) {
        socket.emit('git-delete', { file: file});
      });
    }

    occEditor.navigator_remove_item($(this));
  }

  function update_repository_option(event) {
    event.preventDefault();
    $(".context-menu").remove();
    var socket = occEditor.get_socket();
    var file = $(this).data('file');

    socket.emit("git-pull", { file: file});
  }

}( window.context_menu = window.context_menu || {}, jQuery ));