"use strict";

module.exports = function (app, developmentMode) {

    function send(response, data) {
        process.nextTick(function () {
            response.send(JSON.stringify(data));
        });
    }

    function handleResult(response, result) {
        if (result) {
            switch (typeof(result)) {
                case 'string':
                {
                    send(response, {
                        status: true,
                        message: result
                    });
                    break;
                }
                case 'function':
                {
                    handleResult(response, result());
                    break;
                }
                default :
                {
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
                    break;
                }
            }
        } else {
            send(response, {
                status: false,
                message: 'Empty result'
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
                send(response, {
                    status: false,
                    message: e
                });
            });
        };
    }

    return {
        get: function (path, callback) {
            app.get(path, getRequestHandler(callback));
        },
        post: function (path, callback) {
            app.post(path, getRequestHandler(callback));
        }
    };
};