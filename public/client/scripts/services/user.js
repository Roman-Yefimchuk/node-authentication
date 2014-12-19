'use strict';

angular.module('application')

    .service('userService', [

        '$rootScope',
        'sessionManagerService',

        function ($rootScope, sessionManagerService) {

            var user = null;

            $rootScope.$on('user:updateProfile', function (event, data) {
                user = angular.extend(data, user || {});
            });

            var userService = {
                getData: function (handler) {

                    var successCallback = function (user, externalNotifications) {
                        (handler.success || angular.noop)(user, externalNotifications);
                    };

                    var failureCallback = function (error) {
                        (handler.failure || angular.noop)(error);
                    };

                    sessionManagerService.isAuthenticated({
                        success: function (response) {
                            if (response.isAuthenticated) {
                                if (user) {
                                    if (user.token == response.token) {
                                        successCallback(user);
                                    } else {
                                        userService.logout(function () {
                                            failureCallback({
                                                status: 'INVALID_TOKEN',
                                                message: 'Your token is invalid for current session'
                                            });
                                        });
                                    }
                                } else {
                                    sessionManagerService.getUserData({
                                        success: function (data) {
                                            user = data.user;
                                            successCallback(user, data.externalNotifications);
                                        },
                                        failure: function (error) {
                                            failureCallback(error);
                                        }
                                    });
                                }
                            } else {
                                failureCallback({
                                    status: 'NOT_AUTHENTICATED',
                                    message: 'You are not authenticated'
                                });
                            }
                        },
                        failure: function (error) {
                            failureCallback(error);
                        }
                    });
                },
                logout: function (callback) {
                    sessionManagerService.logout({
                        success: function () {
                            user = null;
                            callback();
                        },
                        failure: function () {
                            user = null;
                            callback();
                        }
                    });
                }
            };

            return userService;
        }
    ]
);
