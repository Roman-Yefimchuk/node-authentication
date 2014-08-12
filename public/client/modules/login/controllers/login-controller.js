"use strict";

login.controller('LoginController', [

    '$scope',
    'apiProvider',

    function ($scope, apiProvider) {

        var emailPattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
        var passwordPattern = /^(([a-z]|[A-Z]|[0-9]|\u005F)+){6}$/;

        $scope.workspaces = [];
        $scope.currentWorkspace = undefined;

        apiProvider.getAllWorkspaces(function (workspaces) {
            if (workspaces.length > 0) {
                $scope.workspaces = workspaces;
                $scope.currentWorkspace = workspaces[0];
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
            $scope.email = 'roman@gmail.com';
            $scope.password = 'qwerty';

            $scope.$watch('email', function () {
                $('[action="/login"]').submit();
            });
        }
    }
]);
