"use strict";

angular.module('application')

    .controller('SuspendDialogController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var leaveCallback = options.leaveCallback || function (closeCallback) {
                closeCallback();
            };

            $scope.$on('suspendDialog:close', function () {
                $modalInstance.close();
            });

            function leaveLecture() {
                leaveCallback(function () {
                    $modalInstance.close();
                });
            }

            $scope.leaveLecture = leaveLecture;
        }
    ]
);
