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

    return Exception;
})();