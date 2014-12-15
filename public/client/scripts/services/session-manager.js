'use strict';

angular.module('application')

    .service('sessionManagerService', [

        'httpClientService',

        function (httpClientService) {
            return {
                isAuthenticated: function (handler) {
                    httpClientService.sendRequest({
                        url: RestApi.IS_AUTHENTICATED
                    }, handler);
                },
                getUserData: function (handler) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_USER_DATA
                    }, handler);
                },
                logout: function (handler) {
                    httpClientService.sendRequest({
                        url: RestApi.LOGOUT
                    }, handler);
                }
            };
        }
    ]
);
