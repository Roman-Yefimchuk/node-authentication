"use strict";

(function () {

    var rootContext = this;

    var AuthenticateErrorCodes = {
        USER_NOT_FOUND: 'USER_NOT_FOUND',
        USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
        INVALID_PASSWORD: 'INVALID_PASSWORD'
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = AuthenticateErrorCodes;
        }
        exports.AuthenticateErrorCodes = AuthenticateErrorCodes;
    } else {
        rootContext.AuthenticateErrorCodes = AuthenticateErrorCodes;
    }

}.call(this));