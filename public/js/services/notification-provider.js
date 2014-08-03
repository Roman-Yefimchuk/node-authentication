app.factory('notificationProvider', function () {

    function showNotification(message, type) {
        $.notify(message, {
            position: "right bottom",
            className: 'info',
            autoHideDelay: 2500
        });
    }

    return {
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