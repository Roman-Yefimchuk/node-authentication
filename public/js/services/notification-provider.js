app.factory('notificationProvider', function () {

    function showNotification(message, type) {
        $.notify(message, {
            position: "right bottom",
            className: type,
            autoHideDelay: 3000
        });
    }

    return {
        notify: function (message, type) {
            if (type == 'warning') {
                type = 'warn';
            }
            showNotification(message, type);
        },
        info: function (message) {
            showNotification(message, 'info');
        },
        success: function (message) {
            showNotification(message, 'success');
        },
        error: function (message) {
            showNotification(message, 'error');
        },
        warning: function (message) {
            showNotification(message, 'warn');
        }
    };
});