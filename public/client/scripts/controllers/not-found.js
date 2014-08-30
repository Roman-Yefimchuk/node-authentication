"use strict";

angular.module('application')

    .controller('NotFoundController', [

        '$scope',
        '$location',

        function ($scope, $location) {
            $scope.requestUrl = $location.path();
        }
    ]
);
