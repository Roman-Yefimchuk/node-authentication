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

            function isNameValid() {
                var name = ($scope.name || '');
                return NAME_PATTERN.test(name);
            }

            function isEmailValid() {
                var email = ($scope['email'] || '').toLowerCase();
                return EMAIL_PATTERN.test(email);
            }

            function isPasswordValid() {
                var password = ($scope['password'] || '').toLowerCase();
                return PASSWORD_PATTERN.test(password) && $scope.password == $scope.retypedPassword;
            }

            function quickSingUp() {
                $scope.name = 'Roman Yefimchuk';
                $scope.email = 'efimchuk.roma@gmail.com';
                $scope.password = 'qwerty';
                $scope.retypedPassword = 'qwerty';

                signUp();
            }

            function signUp() {

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
            }

            $scope.errorMessage = null;
            $scope.name = "";
            $scope.email = "";
            $scope.password = "";
            $scope.retypedPassword = "";

            $scope.isNameValid = isNameValid;
            $scope.isEmailValid = isEmailValid;
            $scope.isPasswordValid = isPasswordValid;
            $scope.quickSingUp = quickSingUp;
            $scope.signUp = signUp;
        }
    ]
);
