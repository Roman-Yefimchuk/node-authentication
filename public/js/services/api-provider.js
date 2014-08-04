app.factory('apiProvider', [

    '$http',

    function ($http) {

        function sendRequest(params, callback) {
            var request = $http(params);

            if (!callback) {
                callback = function () {
                };
            }

            request.success(function (response) {
                if (response.status) {
                    if (response.data) {
                        callback(response.data);
                    } else {
                        callback({});
                    }
                    console.log(response.message);
                } else {
                    var message = response.message;
                    if (message.message) {
                        alert('error: ' + message.message);
                    } else {
                        alert('error: ' + message);
                    }
                }
            });

            request.error(function (data) {
                alert('error: ' + data);
            });
        }

        return {
            items: function (workspaceId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/items/' + workspaceId
                }, callback);
            },
            save: function (workspaceId, todoModel, callback) {
                sendRequest({
                    method: 'POST',
                    url: '/api/save/' + workspaceId,
                    data: {
                        todoModel: todoModel
                    }
                }, function (data) {
                    callback(data.itemId);
                });
            },
            update: function (workspaceId, todoModels, callback) {
                sendRequest({
                    method: 'POST',
                    url: '/api/update/' + workspaceId,
                    data: {
                        todoModels: todoModels
                    }
                }, callback);
            },
            remove: function (workspaceId, todoIds, callback) {
                sendRequest({
                    method: 'POST',
                    url: '/api/remove/' + workspaceId,
                    data: {
                        todoIds: todoIds
                    }
                }, callback);
            },
            getAllWorkspaces: function (callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-all-workspaces'
                }, callback);
            },
            setUserWorkspace: function (workspaceId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/set-user-workspace/' + workspaceId
                }, callback);
            },
            getAllUsers: function (callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-all-users'
                }, callback);
            },
            getPermittedWorkspaces: function (callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-permitted-workspaces'
                }, callback);
            },
            getAllUsersWithPermissions: function (workspaceId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-all-users-with-permissions/' + workspaceId
                }, callback);
            },
            setUsersPermissionsForWorkspace: function (workspaceId, collection, callback) {
                sendRequest({
                    method: 'POST',
                    url: '/api/set-users-permissions-for-workspace/' + workspaceId,
                    data: {
                        collection: collection
                    }
                }, callback);
            },
            getUsers: function (ids, callback) {
                sendRequest({
                    method: 'POST',
                    url: '/api/get-users',
                    data: {
                        ids: ids
                    }
                }, callback);
            },
            getUser: function (userId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-user/' + userId
                }, callback);
            },
            getWorkspace: function (workspaceId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-workspace/' + workspaceId
                }, callback);
            },
            getDefaultWorkspace: function (userId, callback) {
                sendRequest({
                    method: 'GET',
                    url: '/api/get-default-workspace/' + userId
                }, callback);
            }
        };
    }
]);