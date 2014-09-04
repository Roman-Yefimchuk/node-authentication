"use strict";

module.exports = function (app, passport, dbProvider, developmentMode) {

    var Exception = require('../exception');

    function getError(error) {
        if (error instanceof Exception) {
            return error;
        }
        return new Exception(Exception.UNHANDLED_EXCEPTION, 'Unhandled exception', error);
    }

    function send(response, data) {
        process.nextTick(function () {
            response.send(JSON.stringify(data));
        });
    }

    function getAuthenticateHandler(request, response, callback) {
        return function (error, user, info) {
            if (error) {
                send(response, {
                    status: false,
                    error: getError(error)
                });
            } else {
                if (info instanceof Exception) {
                    send(response, {
                        status: false,
                        error: info
                    });
                } else {
                    if (user) {
                        request.logIn(user, function (error) {
                            if (error) {
                                send(response, {
                                    status: false,
                                    error: getError(error)
                                });
                            } else {
                                if (callback) {
                                    callback(user, function () {
                                        send(response, {
                                            status: true
                                        });
                                    });
                                } else {
                                    send(response, {
                                        status: true
                                    });
                                }
                            }
                        });
                    } else {
                        send(response, {
                            status: false,
                            error: new Exception(Exception.USER_NOT_FOUND, 'User not found.')
                        });
                    }
                }
            }
        };
    }

    app.post('/api/authenticate/login', function (request, response, next) {

        var authenticateHandler = getAuthenticateHandler(request, response, function (user, callback) {
            dbProvider.setUserWorkspaceId(user.userId, request.body['workspaceId'], callback)
        });

        passport.authenticate('local-login', authenticateHandler)(request, response, next);
    });

    app.post('/api/authenticate/sign-up', function (request, response, next) {

        var authenticateHandler = getAuthenticateHandler(request, response);

        passport.authenticate('local-sign-up', authenticateHandler)(request, response, next);
    });
};