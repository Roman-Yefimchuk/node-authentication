"use strict";

(function () {

    var AuthenticateException = require('../../../../authenticate-exception');

    function getHandler(request, response, next) {
        return function (error, user, info) {

            if (info instanceof AuthenticateException) {
                var authenticateException = info;
                return response.redirect('#/sign-in?authenticate_error_code=' + authenticateException.authenticateErrorCode);
            } else {

                if (error) {
                    return next(error);
                }

                if (request.isAuthenticated()) {
                    request.logout();
                }

                request.login(user, function (error) {
                    if (error) {
                        return next(error);
                    }
                    return response.redirect('#/home');
                });
            }

        };
    }

    module.exports = {
        getHandler: getHandler
    };

})();