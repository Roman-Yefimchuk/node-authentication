"use strict";

angular.module('application')

    .controller('EmailNotificationController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            function attachEmail() {
                dialogsService.showEmailDialog({
                    onAttach: function (email, closeCallback) {
                        apiService.checkEmailExists(email, {
                            success: function (response) {
                                if (response.isEmailExists) {
                                    dialogsService.showAlert({
                                        context: {
                                            email: email
                                        },
                                        title: 'Failure',
                                        message: 'Email <b>{{ email }}</b> already exists.'
                                    });
                                } else {
                                    apiService.attachEmail(email, {
                                        success: function () {
                                            closeCallback();

                                            dialogsService.showAlert({
                                                context: {
                                                    email: email
                                                },
                                                title: 'Success',
                                                message: 'Email <b>{{ email }}</b> succesfully attached. ' +
                                                    'Check your email for confirmation',
                                                onAccept: function (closeCallback) {
                                                    $scope.notification = null;
                                                    closeCallback();
                                                }
                                            });
                                        },
                                        failure: function () {
                                            closeCallback();
                                            dialogsService.showAlert({
                                                context: {
                                                    email: email
                                                },
                                                title: "Error",
                                                message: "Can't attach email <b>{{ email }}</b>"
                                            });
                                        }
                                    });
                                }
                            },
                            failure: function () {
                                closeCallback();
                                dialogsService.showAlert({
                                    title: "Error",
                                    message: "Can't check email exists</b>"
                                });
                            }
                        });
                    }
                })
            }

            function verifyEmail() {
                var email = $scope.notification['email'];
                apiService.verifyEmail(email, {
                    success: function () {
                        dialogsService.showAlert({
                            context: {
                                email: email
                            },
                            title: 'Success',
                            message: 'Request for verification email <b>{{ email }}</b> sent',
                            onAccept: function (closeCallback) {
                                $scope.notification = null;
                                closeCallback();
                            }
                        });
                    },
                    failure: function () {
                        dialogsService.showAlert({
                            context: {
                                email: email
                            },
                            title: "Error",
                            message: "Can't send request for verify email <b>{{ email }}</b>"
                        });
                    }
                });
            }

            function hideAlert() {
                $scope.notification = null;
            }

            $scope.notification = null;

            $scope.attachEmail = attachEmail;
            $scope.verifyEmail = verifyEmail;
            $scope.hideAlert = hideAlert;

            $scope.$on('home:emailNotAttached', function () {
                $scope.notification = {
                    command: ExternalNotificationCommands.EMAIL_NOT_ATTACHED
                };
            });

            $scope.$on('home:emailNotVerified', function (event, email) {
                $scope.notification = {
                    command: ExternalNotificationCommands.EMAIL_NOT_VERIFIED,
                    email: email
                };
            });
        }
    ]
);
