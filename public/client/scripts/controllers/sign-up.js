"use strict";

angular.module('application')

    .controller('SignUpController', [

        '$scope',
        '$location',
        'loaderService',
        'apiService',
        'NAME_PATTERN',
        'EMAIL_PATTERN',
        'PASSWORD_PATTERN',

        function ($scope, $location, loaderService, apiService, NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN) {

            $scope.errorMessage = null;

            $scope.name = "";
            $scope.email = "";
            $scope.password = "";
            $scope.retypedPassword = "";

            $scope.isNameValid = function () {
                var name = ($scope.name || '');
                return NAME_PATTERN.test(name);
            };

            $scope.isEmailValid = function () {
                var email = ($scope['email'] || '').toLowerCase();
                return EMAIL_PATTERN.test(email);
            };

            $scope.isPasswordValid = function () {
                var password = ($scope['password'] || '').toLowerCase();
                return PASSWORD_PATTERN.test(password) && $scope.password == $scope.retypedPassword;
            };

            $scope.quickSingUp = function () {
                $scope.name = 'Roman Yefimchuk';
                $scope.email = 'roman@gmail.com';
                $scope.password = 'qwerty';
                $scope.retypedPassword = 'qwerty';

                $scope.$watch('email', function () {
                    $scope.signUp();
                });
            };

            $scope.signUp = function () {

                loaderService.showLoader();

                apiService.signUp({
                    name: $scope.name,
                    email: $scope.email,
                    password: $scope.password
                }, {
                    success: function () {
                        $location.path('/home');
                    },
                    failure: function (error) {
                        $scope.errorMessage = error.message;
                        loaderService.hideLoader();
                    }
                });
            };
        }
    ]
);
