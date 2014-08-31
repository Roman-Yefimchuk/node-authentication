"use strict";

angular.module('application')

    .controller('LogoutController', [

        '$scope',
        '$location',
        'socketsService',

        function ($scope, $location, socketsService) {

            socketsService.closeConnection();
            $location.path('/');
        }
    ]
);
