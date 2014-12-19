"use strict";

(function () {

    var rootContext = this;

    var ExternalNotificationCommands = {
        ACCESS_CLOSED: 'ACCESS_CLOSED',
        EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
        EMAIL_NOT_DEFINED: 'EMAIL_NOT_DEFINED'
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = ExternalNotificationCommands;
        }
        exports.ExternalNotificationCommands = ExternalNotificationCommands;
    } else {
        rootContext.ExternalNotificationCommands = ExternalNotificationCommands;
    }

}.call(this));