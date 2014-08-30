'use strict';

angular.module('application')

    .service('httpClientService', [

        '$http',
        '$log',
        '$location',
        'DEBUG_MODE',

        function ($http, $log, $location, DEBUG_MODE) {

            function traceResponse(params, response) {
                if (DEBUG_MODE) {

                    if (params.method == 'POST' || params.method == 'PUT') {
                        $log.debug('payload ->');
                        $log.debug(params.data || {});
                    }

                    $log.debug('response ->');
                    $log.debug(response.data || {});
                }
            }

            return {
                sendRequest: function (params, handler) {
                    var successCallback = handler.success || angular.noop;
                    var failureCallback = handler.failure || angular.noop;

                    var request = $http(params);

                    request.success(function (response, status, headers, config) {
                        if (response) {
                            if (response.status) {

                                $log.debug('URL[' + params.method + '] -> ' + params.url);
                                traceResponse(params, response);

                                successCallback(response.data || {});
                            } else {
                                failureCallback(response.error);
                            }
                        } else {
                            failureCallback({
                                status: 'EMPTY_RESPONSE',
                                message: 'Empty response'
                            });
                        }
                    });

                    request.error(function (data, status, headers, config) {
                        (handler.failure || angular.noop)({
                            status: status,
                            message: '',
                            data: data
                        });
                    });
                }
            };
        }
    ]
);