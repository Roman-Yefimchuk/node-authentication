"use strict";

module.exports = (function () {

    var Exception = function (status, message, data) {

        var context = this;

        this.status = status;
        this.message = message;
        this.data = data;
    };

    Exception.NOT_AUTHENTICATED = 'NOT_AUTHENTICATED';
    Exception.INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
    Exception.UNHANDLED_EXCEPTION = 'UNHANDLED_EXCEPTION';
    Exception.PAGE_NOT_FOUND = 'PAGE_NOT_FOUND';
    Exception.INVALID_PASSWORD = 'INVALID_PASSWORD';
    Exception.IO_EXCEPTION = 'IO_EXCEPTION';
    Exception.USER_NOT_FOUND = 'USER_NOT_FOUND';
    Exception.EMAIL_ALREADY_EXIST = 'EMAIL_ALREADY_EXIST';

    return Exception;
})();