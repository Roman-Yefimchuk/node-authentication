"use strict";

angular.module('application')

    .controller('EmailDialogController', [

        '$scope',
        '$modalInstance',
        'options',
        'EMAIL_PATTERN',

        function ($scope, $modalInstance, options, EMAIL_PATTERN) {

            var onAttach = options.onAttach || function (closeCallback) {
                closeCallback();
            };

            function isEmailValid() {
                var email = ($scope.emailModel['email'] || '').toLowerCase();
                return EMAIL_PATTERN.test(email);
            }

            function isAttachDisabled() {
                return !isEmailValid();
            }

            function attach() {

                if (isAttachDisabled()) {
                    return;
                }

                onAttach($scope.emailModel['email'], function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.close();
            }

            $scope.emailModel = {
                email: ''
            };

            $scope.isEmailValid = isEmailValid;
            $scope.isAttachDisabled = isAttachDisabled;
            $scope.attach = attach;
            $scope.cancel = cancel;
        }
    ]
);
