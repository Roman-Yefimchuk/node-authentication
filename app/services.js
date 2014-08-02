module.exports = function (app, dbProvider) {

    var getUserContext = require('./context-provider')['getUserContext'];
    var serviceProvider = require('./service-provider')(app);

    function getParam(paramName, request) {
        var params = request.params;
        return params[paramName];
    }

    function getUserId(request) {
        var user = request.user;
        var userId = getUserContext(user)['userId'];
        if (userId) {
            return userId;
        } else {
            throw 'Access denied';
        }
    }

    serviceProvider.post('/api/set-users-permissions-for-workspace/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var collection = request.body['collection'];
        dbProvider.setUsersPermissionsForWorkspace(workspaceId, collection, function () {
            resultCallback('Updated ' + collection.length + ' permission(s)');
        });
    });

    serviceProvider.get('/api/get-all-users-with-permissions/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        dbProvider.getAllUsersWithPermissions(workspaceId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' permitted workspaces(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get('/api/get-permitted-workspaces', function (request, response, resultCallback) {
        var userId = getUserId(request);
        dbProvider.getPermittedWorkspaces(userId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' permitted workspaces(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get('/api/get-all-users', function (request, response, resultCallback) {
        dbProvider.getAllUsers(function (users) {
            resultCallback({
                message: 'Selected ' + users.length + ' users(s)',
                data: users
            });
        });
    });

    serviceProvider.get('/api/get-all-workspaces', function (request, response, resultCallback) {
        dbProvider.getAllWorkspaces(function (workspaces) {
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

    serviceProvider.post('/api/add-workspace', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var name = request.body['name'];
        resultCallback();
    });

    serviceProvider.get('/api/items/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request)
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
        dbProvider.save(workspaceId, userId, todoModel, function (itemId) {
            resultCallback({
                message: 'Item[' + itemId + '] saved',
                data: {
                    itemId: itemId
                }
            });
        });
    });

    serviceProvider.post('/api/update/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var todoModels = request.body['todoModels'];
        dbProvider.update(workspaceId, userId, todoModels, function () {
            resultCallback('Updated ' + todoModels.length + ' item(s)');
        });
    });

    serviceProvider.post('/api/remove/:workspaceId', function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);
        var todoIds = request.body['todoIds'];
        dbProvider.remove(workspaceId, userId, todoIds, function () {
            resultCallback('Removed ' + todoIds.length + ' item(s)');
        });
    });
};