"use strict";

angular.module('application')

    .controller('LogoutController', [

        '$scope',
        '$rootScope',
        '$location',
        'socketsService',

        function ($scope, $rootScope, $location, socketsService) {
            socketsService.closeConnection();
            $rootScope.$broadcast('application:Logout');
            $location.path('/');
        }
    ]
);
