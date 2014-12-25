"use strict";

(function (require) {

    module.exports = function (app, dbProvider, serviceProvider) {

        var Exception = require('../exception');
        var RestApi = require('../../public/common-scripts/rest-api');
        var ExternalNotificationCommands = require('../../public/common-scripts/external-notification-commands');

        serviceProvider.get(RestApi.IS_AUTHENTICATED, function (request, response, resultCallback) {
            if (request.isAuthenticated()) {
                var user = request.user;
                resultCallback({
                    data: {
                        isAuthenticated: true,
                        token: user.token
                    }
                });
            } else {
                resultCallback({
                    data: {
                        isAuthenticated: false
                    }
                });
            }
        });

        serviceProvider.get(RestApi.GET_USER_DATA, function (request, response, resultCallback) {

            if (request.isAuthenticated()) {

                var user = request.user;
                var userId = user.userId;

                var sendResponse = function (workspaceId, rootWorkspaceId, defaultWorkspaceId, externalNotifications) {
                    resultCallback({
                        data: {
                            user: {
                                userId: userId,
                                token: user.token,
                                displayName: user.displayName,
                                authorizationProvider: user.authorizationProvider,
                                workspaceId: workspaceId,
                                rootWorkspaceId: rootWorkspaceId,
                                defaultWorkspaceId: defaultWorkspaceId
                            },
                            externalNotifications: externalNotifications
                        }
                    });
                };

                var checkWorkspace = function (workspaceId, rootWorkspaceId) {

                    var externalNotifications = [];

                    if (!user.email) {
                        externalNotifications.push({
                            command: ExternalNotificationCommands.EMAIL_NOT_ATTACHED
                        });
                    } else {
                        if (!user.isEmailVerified) {
                            externalNotifications.push({
                                command: ExternalNotificationCommands.EMAIL_NOT_VERIFIED,
                                data: {
                                    email: user.email
                                }
                            });
                        }
                    }

                    dbProvider.isAccessGrantedForWorkspace(userId, workspaceId, function (isAccessGranted) {
                        dbProvider.getDefaultWorkspaceId(userId, function (defaultWorkspaceId) {
                            if (isAccessGranted) {
                                sendResponse(workspaceId, rootWorkspaceId, defaultWorkspaceId, externalNotifications);
                            } else {
                                dbProvider.getWorkspace(workspaceId, function (workspace) {

                                    externalNotifications.push({
                                        command: ExternalNotificationCommands.ACCESS_CLOSED,
                                        data: {
                                            workspaceName: workspace.name
                                        }
                                    });

                                    sendResponse(defaultWorkspaceId, rootWorkspaceId, defaultWorkspaceId, externalNotifications);
                                });
                            }
                        });
                    });
                };

                dbProvider.getUserWorkspaceId(userId, function (workspaceId, rootWorkspaceId) {
                    checkWorkspace(workspaceId, rootWorkspaceId);
                });

            } else {
                throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
            }
        });

        serviceProvider.get(RestApi.LOGOUT, function (request, response, resultCallback) {
            request.logout();
            resultCallback();
        });
    };

})(require);