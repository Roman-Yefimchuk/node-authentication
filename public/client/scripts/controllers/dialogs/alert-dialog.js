"use strict";

angular.module('application')

    .controller('AlertDialogController', [

        '$scope',
        '$interpolate',
        '$modalInstance',
        'options',

        function ($scope, $interpolate, $modalInstance, options) {

            var context = options.context || {};

            $scope.title = $interpolate(options.title)(context);
            $scope.message = $interpolate(options.message)(context);

            $scope.ok = function () {
                $modalInstance.close();
            };
        }
    ]
);
