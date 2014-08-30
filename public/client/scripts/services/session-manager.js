'use strict';

angular.module('application')

    .service('sessionManagerService', [

        'httpClientService',

        function (httpClientService) {
            return {
                isAuthenticated: function (handler) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/is-authenticated'
                    }, handler);
                },
                getUserData: function (handler) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/get-user-data'
                    }, handler);
                },
                logout: function (handler) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/logout'
                    }, handler);
                }
            };
        }
    ]
);
