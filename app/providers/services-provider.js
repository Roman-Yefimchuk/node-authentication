"use strict";

(function (require) {

    module.exports = function (app, developmentMode) {

        var Exception = require('../exception');
        var JSON = require('json3');

        function send(request, response, data) {
            process.nextTick(function () {
                var json = JSON.stringify(data);
                response.send(json);
            });
        }

        function handleResult(request, response, result) {
            if (result) {
                if (typeof result == 'string') {
                    send(request, response, {
                        status: true,
                        message: result
                    });
                } else {
                    var message = result.message;
                    var data = result.data;
                    if (data) {
                        send(request, response, {
                            status: true,
                            message: message,
                            data: data
                        });
                    } else {
                        send(request, response, {
                            status: true,
                            message: message
                        });
                    }
                }
            } else {
                send(request, response, {
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
                    e = new Exception(Exception.UNHANDLED_EXCEPTION, 'Unhandled exception');
                    failureCallback(e);
                }
            }
        }

        function getRequestHandler(callback) {
            return function (request, response) {
                executeService(function () {
                    callback(request, response, function (result) {
                        handleResult(request, response, result);
                    });
                }, function (e) {
                    if (e instanceof Exception) {
                        send(request, response, {
                            status: false,
                            error: e
                        });
                    } else {
                        e = new Exception(Exception.UNHANDLED_EXCEPTION, 'Unhandled exception', e);
                        send(request, response, {
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

})(require);