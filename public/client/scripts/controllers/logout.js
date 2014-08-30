"use strict";

angular.module('application')

    .controller('LogoutController', [

        '$scope',
        '$location',

        function ($scope, $location) {
            $location.path('/');
        }
    ]
);
