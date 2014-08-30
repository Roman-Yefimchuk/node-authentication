"use strict";

angular.module('application')

    .controller('SignUpController', [

        '$scope',

        function ($scope) {

            var emailPattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
            var passwordPattern = /^(([a-z]|[A-Z]|[0-9]|\u005F)+){6}$/;

            $scope.errorMessage = null;

            $scope.name = "";
            $scope.email = "";
            $scope.password = "";
            $scope.confirmedPassword = "";

            $scope.isNameValid = function () {
                return $scope.name.length >= 6;
            };

            $scope.isEmailValid = function () {
                return emailPattern.test($scope['email']);
            };

            $scope.isPasswordValid = function () {
                return passwordPattern.test($scope['password']) && $scope.password == $scope.confirmedPassword;
            };

            $scope.quickSingUp = function () {
                $scope.name = 'Roman Yefimchuk';
                $scope.email = 'roman@gmail.com';
                $scope.password = 'qwerty';
                $scope.confirmedPassword = 'qwerty';

                $scope.$watch('email', function () {
                    $('[action="/signup"]').submit();
                });
            }
        }
    ]
);
