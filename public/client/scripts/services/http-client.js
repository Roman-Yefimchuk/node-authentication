'use strict';

angular.module('application')

    .service('httpClientService', [

        '$http',
        '$log',
        '$location',
        'translatorService',
        'DEBUG_MODE',

        function ($http, $log, $location, translatorService, DEBUG_MODE) {

            var httpClientErrorsTranslator = translatorService.getSector('http_client_errors');

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

            var statuses = {};

            _.forEach([
                'NOT_AUTHENTICATED',
                'INTERNAL_SERVER_ERROR',
                'UNHANDLED_EXCEPTION',
                'PAGE_NOT_FOUND',
                'INVALID_PASSWORD',
                'IO_EXCEPTION',
                'USER_NOT_FOUND',
                'EMAIL_ALREADY_EXIST'
            ], function (value) {
                statuses[value] = value.toLowerCase();
            });

            function translateError(error) {
                var key = statuses[error.status];

                if (key) {
                    return httpClientErrorsTranslator.translate(key);
                }
                return error.message;
            }

            function getUrl(urlPattern, urlParams) {
                var url = urlPattern;

                _.forEach(urlParams, function (value, key) {

                    if (value != undefined) {
                        var pattern = new RegExp(':' + key, 'g');
                        url = url.replace(pattern, value);
                    }
                });

                return url;
            }

            return {
                sendRequest: function (requestParams, handler) {
                    var successCallback = handler.success || angular.noop;
                    var failureCallback = handler.failure || angular.noop;

                    var request = $http({
                        method: requestParams.method || 'GET',
                        url: getUrl(requestParams.url, requestParams.urlParams || {}),
                        data: requestParams.data
                    });

                    request.success(function (response, status, headers, config) {

                        if (response) {

                            if (response.status) {

                                $log.debug('URL[' + requestParams.method + '] -> ' + requestParams.url);
                                traceResponse(requestParams, response);

                                successCallback(response.data || {});
                            } else {
                                var error = response.error;

                                failureCallback({
                                    status: error.status,
                                    message: translateError(error),
                                    data: error.data
                                });
                            }
                        } else {
                            failureCallback({
                                status: 'EMPTY_SERVER_RESPONSE',
                                message: httpClientErrorsTranslator.translate('empty_server_response')
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