"use strict";

angular.module('application')

    .service('notificationsService', [

        function () {

            function showNotification(message, type, data) {
                if (message) {
                    if (data) {
                        message = message.format(data);
                    }
                    $.notify(message, {
                        position: "right bottom",
                        className: type,
                        autoHideDelay: 3000
                    });
                }
            }

            return {
                notify: function (message, type, data) {
                    if (type == 'warning') {
                        type = 'warn';
                    }
                    showNotification(message, type, data);
                },
                info: function (message, data) {
                    showNotification(message, 'info', data);
                },
                success: function (message, data) {
                    showNotification(message, 'success', data);
                },
                error: function (message, data) {
                    showNotification(message, 'error', data);
                },
                warning: function (message, data) {
                    showNotification(message, 'warn', data);
                }
            };
        }
    ]
);