"use strict";

module.exports = function (app, developmentMode) {

    var Exception = require('../exception');

    function send(response, data) {
        process.nextTick(function () {
            response.send(JSON.stringify(data));
        });
    }

    function handleResult(response, result) {
        if (result) {
            if (typeof result == 'string') {
                send(response, {
                    status: true,
                    message: result
                });
            } else {
                var message = result.message;
                var data = result.data;
                if (data) {
                    send(response, {
                        status: true,
                        message: message,
                        data: data
                    });
                } else {
                    send(response, {
                        status: true,
                        message: message
                    });
                }
            }
        } else {
            send(response, {
                status: true
            });
        }
    }

    function executeService(serviceBody, failureCallback) {
        try {
            serviceBody();
        } catch (e) {
            if (e) {
                failureCallback(e);
            } else {
                failureCallback('Unknown exception :(');
            }
        }
    }

    function getRequestHandler(callback) {
        return function (request, response) {
            executeService(function () {
                callback(request, response, function (result) {
                    handleResult(response, result);
                });
            }, function (e) {
                if (e instanceof Exception) {
                    send(response, {
                        status: false,
                        error: e
                    });
                } else {
                    e = new Exception(Exception.UNHANDLED_EXCEPTION, 'Unhandled exception', e);
                    send(response, {
                        status: false,
                        error: e
                    });
                }
            });
        };
    }

    return {
        'get': function (path, callback) {
            app.get(path, getRequestHandler(callback));
        },
        'post': function (path, callback) {
            app.post(path, getRequestHandler(callback));
        },
        'put': function (path, callback) {
            app.put(path, getRequestHandler(callback));
        },
        'delete': function (path, callback) {
            app.delete(path, getRequestHandler(callback));
        }
    };
};