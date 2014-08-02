module.exports = function (app) {

    function handleResult(response, result) {
        if (result) {
            switch (typeof(result)) {
                case 'string':
                {
                    response.send({
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
                        response.send({
                            status: true,
                            message: message,
                            data: data
                        });
                    } else {
                        response.send({
                            status: true,
                            message: message
                        });
                    }
                    break;
                }
            }
        } else {
            response.send({
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
                response.send({
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