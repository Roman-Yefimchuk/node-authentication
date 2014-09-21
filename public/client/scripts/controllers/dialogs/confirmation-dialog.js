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

            var onAccept = options.onAccept || angular.noop;
            var onReject = options.onReject || angular.noop;

            function yes() {
                if (onAccept) {
                    onAccept(function () {
                        $modalInstance.close();
                    });
                } else {
                    $modalInstance.close();
                }
            }

            function no() {
                if (onReject) {
                    onReject(function () {
                        $modalInstance.close();
                    });
                } else {
                    $modalInstance.close();
                }
            }

            $scope.yes = yes;
            $scope.no = no;
        }
    ]
);
