"use strict";

angular.module('application')

    .controller('SignUpController', [

        '$scope',
        '$location',
        '$routeParams',
        'loaderService',
        'apiService',
        'NAME_PATTERN',
        'EMAIL_PATTERN',
        'PASSWORD_PATTERN',

        function ($scope, $location, $routeParams, loaderService, apiService, NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN) {

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

            $scope.errorMessage = (function () {
                if ($routeParams['authenticate_error_code']) {
                    switch ($routeParams['authenticate_error_code']) {
                        case AuthenticateErrorCodes.USER_NOT_FOUND:
                        {
                            return 'USER_NOT_FOUND';
                        }
                        case AuthenticateErrorCodes.USER_ALREADY_EXISTS:
                        {
                            return 'USER_ALREADY_EXISTS';
                        }
                    }
                }
                return null;
            })();
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
