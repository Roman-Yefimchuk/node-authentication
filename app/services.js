"use strict";

module.exports = function (app, dbProvider, serviceProvider) {

    var Exception = require('../app/exception');

    function getParam(paramName, request) {
        var params = request.params;
        return params[paramName];
    }

    function getUserId(request) {
        var userAccount = request.user;
        if (userAccount && userAccount.isAuthenticated()) {
            return userAccount.userId;
        } else {
            throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
        }
    }

    serviceProvider.get('/api/get-default-workspace-id/:userId', function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getDefaultWorkspaceId(userId, function (workspaceId) {
            resultCallback({
                message: 'Selected default workspace[' + workspaceId + ']',
                data: {
                    workspaceId: workspaceId
                }
            });
        });
    });

    serviceProvider.get('/api/get-workspace/:workspaceId', function (request, response, resultCallback) {
        var workspaceId = getParam('workspaceId', request);
        dbProvider.getWorkspace(workspaceId, function (workspace) {
            resultCallback({
                message: 'Selected workspace: ' + workspace.name,
                data: workspace
            });
        });
    });

    serviceProvider.get('/api/get-user/:userId', function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getUser(userId, function (user) {
            resultCallback({
                message: 'Selected user: ' + user.displayName,
                data: user
            });
        });
    });

    serviceProvider.post('/api/get-users', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var ids = request.body['ids'];
        dbProvider.getUsers(ids, function (users) {
            resultCallback({
                message: 'Selected ' + users.length + ' user(s)',
                data: users
            });
        });
    });

    serviceProvider.post('/api/set-users-permissions-for-workspace/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var collection = request.body['collection'];
        dbProvider.setUsersPermissionsForWorkspace(workspaceId, collection, function () {
            resultCallback('Updated ' + collection.length + ' permission(s)');
        });
    });

    serviceProvider.post('/api/get-all-users-with-permissions/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);

        var skip = request.body['skip'];
        var limit = request.body['limit'];

        dbProvider.getAllUsersWithPermissions(workspaceId, skip, limit, function (result) {
            resultCallback({
                message: 'Selected ' + result.count + ' user(s)',
                data: result
            });
        });
    });

    serviceProvider.post('/api/get-permitted-workspaces', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        dbProvider.getPermittedWorkspaces(userId, parentWorkspaceId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' permitted workspaces(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.post('/api/get-all-users', function (request, response, resultCallback) {

        var skip = request.body['skip'];
        var limit = request.body['limit'];

        dbProvider.getAllUsers(skip, limit, function (result) {
            resultCallback({
                message: 'Selected ' + result.count + ' users(s)',
                data: result
            });
        });
    });

    serviceProvider.post('/api/get-all-workspaces', function (request, response, resultCallback) {
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        dbProvider.getAllWorkspaces(parentWorkspaceId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get('/api/get-workspaces/:userId', function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getWorkspaces(userId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get('/api/get-user-workspace', function (request, response, resultCallback) {
        var userId = getUserId(request);
        dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
            resultCallback({
                message: 'Current user workspace ID: ' + workspaceId,
                data: {
                    workspaceId: workspaceId
                }
            });
        });
    });

    serviceProvider.get('/api/set-user-workspace/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        dbProvider.setUserWorkspaceId(userId, workspaceId, function (permissions, isOwnWorkspace) {
            resultCallback({
                message: 'New workspace ID: ' + workspaceId,
                data: {
                    permissions: permissions,
                    isOwnWorkspace: isOwnWorkspace
                }
            });
        });
    });

    serviceProvider.post('/api/create-workspace', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceName = request.body['workspaceName'];
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        dbProvider.createWorkspace(workspaceName, userId, parentWorkspaceId, function (workspace) {
            resultCallback({
                message: 'Created new workspace: ' + workspace.name,
                data: {
                    workspace: workspace
                }
            });
        });
    });

    serviceProvider.post('/api/update-workspace/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = getParam('workspaceId', request);
        var data = request.body['data'];
        dbProvider.updateWorkspace(workspaceId, data, function () {
            resultCallback();
        });
    });

    serviceProvider.get('/api/remove-workspace/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = getParam('workspaceId', request);
        dbProvider.removeWorkspace(userId, workspaceId, function (removedWorkspaces) {
            resultCallback({
                message: 'Removed ' + removedWorkspaces.length + ' workspace(s)',
                data: removedWorkspaces
            });
        });
    });

    serviceProvider.get('/api/items/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        dbProvider.getItems(workspaceId, userId, function (items) {
            resultCallback({
                message: 'Selected ' + items.length + ' item(s)',
                data: items
            });
        });
    });

    serviceProvider.post('/api/save/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var todoModel = request.body['todoModel'];
        dbProvider.saveItem(workspaceId, userId, todoModel, function (item) {
            resultCallback({
                message: 'Item[' + item.itemId + '] saved',
                data: item
            });
        });
    });

    serviceProvider.post('/api/update/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var todoModels = request.body['todoModels'];
        dbProvider.updateItems(workspaceId, userId, todoModels, function () {
            resultCallback('Updated ' + todoModels.length + ' item(s)');
        });
    });

    serviceProvider.post('/api/remove/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var todoIds = request.body['todoIds'];
        dbProvider.removeItems(workspaceId, userId, todoIds, function () {
            resultCallback('Removed ' + todoIds.length + ' item(s)');
        });
    });
};