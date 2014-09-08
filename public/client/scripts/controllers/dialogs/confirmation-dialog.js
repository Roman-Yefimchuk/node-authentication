"use strict";

angular.module('application')

    .controller('ConfirmationDialogController', [

        '$scope',
        '$interpolate',
        '$modalInstance',
        'options',

        function ($scope, $interpolate, $modalInstance, options) {

            var context = options.context || {};

            $scope.title = $interpolate(options.title)(context);
            $scope.message = $interpolate(options.message)(context);

            var onAccept = options.onAccept;
            var onReject = options.onReject;

            $scope.yes = function () {
                if (onAccept) {
                    onAccept(function () {
                        $modalInstance.close();
                    });
                } else {
                    $modalInstance.close();
                }
            };

            $scope.no = function () {
                if (onReject) {
                    onReject(function () {
                        $modalInstance.close();
                    });
                } else {
                    $modalInstance.close();
                }
            };
        }
    ]
);
