"use strict";

module.exports = function (app, dbProvider, serviceProvider) {

    var Exception = require('../app/exception');

    serviceProvider.get('/is-authenticated', function (request, response, resultCallback) {
        var userAccount = request.user;

        if (userAccount && userAccount.isAuthenticated()) {
            resultCallback({
                data: {
                    isAuthenticated: true,
                    token: userAccount.token
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

    serviceProvider.get('/get-user-data', function (request, response, resultCallback) {
        var userAccount = request.user;

        if (userAccount && userAccount.isAuthenticated()) {

            var userId = userAccount.userId;

            var sendResponse = function (workspaceId, defaultWorkspaceId, externalNotification) {
                resultCallback({
                    data: {
                        user: {
                            userId: userId,
                            token: userAccount.token,
                            displayName: userAccount.displayName,
                            authorizationProvider: userAccount.authorizationProvider,
                            workspaceId: workspaceId,
                            defaultWorkspaceId: defaultWorkspaceId
                        },
                        externalNotification: externalNotification
                    }
                });
            };

            var checkWorkspace = function (workspaceId) {
                dbProvider.isAccessGrantedForWorkspace(userId, workspaceId, function (isAccessGranted) {
                    dbProvider.getDefaultWorkspaceId(userId, function (defaultWorkspaceId) {
                        if (isAccessGranted) {
                            sendResponse(workspaceId, defaultWorkspaceId);
                        } else {
                            dbProvider.getWorkspace(workspaceId, function (workspace) {
                                sendResponse(defaultWorkspaceId, defaultWorkspaceId, {
                                    type: 'warning',
                                    message: 'Access to workspace ' + workspace.name + ' closed'
                                });
                            });
                        }
                    });
                });
            };

            dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
                checkWorkspace(workspaceId);
            });

        } else {
            throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
        }
    });

    serviceProvider.get('/logout', function (request, response, resultCallback) {
        request.logout();
        resultCallback();
    });
};