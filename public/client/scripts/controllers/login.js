"use strict";

angular.module('application')

    .controller('LoginController', [

        '$scope',
        'apiService',
        'loaderService',
        'DEBUG_MODE',

        function ($scope, apiService, loaderService, DEBUG_MODE) {

            var emailPattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
            var passwordPattern = /^(([a-z]|[A-Z]|[0-9]|\u005F)+){6}$/;

            $scope.errorMessage = null;

            $scope.workspaces = [];
            $scope.currentWorkspace = undefined;

            loaderService.showLoader();

            apiService.getAllWorkspaces(function (workspaces) {
                if (workspaces.length > 0) {
                    $scope.workspaces = workspaces;
                    $scope.currentWorkspace = workspaces[0];

                    loaderService.hideLoader();
                }
            });

            $scope.workspaceDropdown = {
                isOpen: false
            };

            $scope.email = "";
            $scope.password = "";

            $scope.chooseWorkspace = function (workspace) {
                $scope.currentWorkspace = workspace;
                $scope.workspaceDropdown['isOpen'] = false;
            };

            $scope.isEmailValid = function () {
                return emailPattern.test($scope['email']);
            };

            $scope.isPasswordValid = function () {
                return passwordPattern.test($scope['password']);
            };

            $scope.quickLogin = function () {
                if (DEBUG_MODE) {
                    $scope.email = 'roman@gmail.com';
                    $scope.password = 'qwerty';

                    $scope.$watch('email', function () {
                        $('[action="/login"]').submit();
                    });
                }
            }
        }
    ]
);
