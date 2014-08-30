'use strict';

angular.module('application')

    .service('userService', [

        '$rootScope',
        'sessionManagerService',

        function ($rootScope, sessionManagerService) {

            var userData = null;

            $rootScope.$on('user:updateProfile', function (event, data) {
                userData = angular.extend(data, userData || {});
            });

            var userService = {
                getData: function (handler) {

                    var successCallback = function (userData) {
                        (handler.success || angular.noop)(userData);
                    };

                    var failureCallback = function (error) {
                        (handler.failure || angular.noop)(error);
                    };

                    sessionManagerService.isAuthenticated({
                        success: function (response) {
                            if (response.isAuthenticated) {
                                if (userData) {
                                    if (userData.token == response.token) {
                                        successCallback(userData);
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
                                            userData = data;
                                            successCallback(data);
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
                            userData = null;
                            callback();
                        },
                        failure: function () {
                            userData = null;
                            callback();
                        }
                    });
                }
            };

            return userService;
        }
    ]
);
