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

            var defaultCloseCallback = function (closeCallback) {
                closeCallback();
            };

            var onAccept = options.onAccept || defaultCloseCallback;
            var onReject = options.onReject || defaultCloseCallback;

            function yes() {
                onAccept(function () {
                    $modalInstance.close();
                });
            }

            function no() {
                onReject(function () {
                    $modalInstance.close();
                });
            }

            $scope.yes = yes;
            $scope.no = no;
        }
    ]
);
