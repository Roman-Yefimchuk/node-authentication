"use strict";

angular.module('application')

    .controller('EmailNotificationController', [

        '$scope',
        '$cookieStore',
        'apiService',
        'dialogsService',

        function ($scope, $cookieStore, apiService, dialogsService) {

            function getEmailNotificationConfig() {
                return $cookieStore.get('emailNotificationConfig') || [];
            }

            function putEmailNotificationConfig(config) {
                $cookieStore.put('emailNotificationConfig', config)
            }

            function disableNotification() {
                var notification = $scope.notification;
                if (notification) {
                    var config = getEmailNotificationConfig();
                    var command = notification.command;
                    if (_.indexOf(config, command) == -1) {
                        config.push(command);
                        putEmailNotificationConfig(config);
                    }
                    $scope.notification = null;
                }
            }

            function attachEmail() {
                dialogsService.showEmailDialog({
                    onAttach: function (email, closeCallback) {
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

            $scope.notification = null;

            $scope.disableNotification = disableNotification;
            $scope.attachEmail = attachEmail;
            $scope.verifyEmail = verifyEmail;

            $scope.$on('home:emailNotAttached', function () {

                var config = getEmailNotificationConfig();
                var command = ExternalNotificationCommands.EMAIL_NOT_ATTACHED;

                if (_.indexOf(config, command) == -1) {
                    $scope.notification = {
                        command: command
                    };
                }
            });

            $scope.$on('home:emailNotVerified', function (event, email) {

                var config = getEmailNotificationConfig();
                var command = ExternalNotificationCommands.EMAIL_NOT_VERIFIED;

                if (_.indexOf(config, command) == -1) {
                    $scope.notification = {
                        command: ExternalNotificationCommands.EMAIL_NOT_VERIFIED,
                        email: email
                    };
                }
            });
        }
    ]
);
