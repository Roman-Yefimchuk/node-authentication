"use strict";

angular.module('application')

    .service('apiService', [

        'httpClientService',

        function (httpClientService) {

            return {
                login: function (data, handler) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        data: data,
                        url: '/api/login'
                    }, handler);
                },
                signUp: function (data, handler) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        data: data,
                        url: '/api/sign-up'
                    }, handler);
                },
                items: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/items/' + workspaceId
                    }, {
                        success: callback
                    });
                },
                save: function (workspaceId, todoModel, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/save/' + workspaceId,
                        data: {
                            todoModel: todoModel
                        }
                    }, {
                        success: callback
                    });
                },
                update: function (workspaceId, todoModels, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/update/' + workspaceId,
                        data: {
                            todoModels: todoModels
                        }
                    }, {
                        success: callback
                    });
                },
                remove: function (workspaceId, todoIds, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/remove/' + workspaceId,
                        data: {
                            todoIds: todoIds
                        }
                    }, {
                        success: callback
                    });
                },
                getAllWorkspaces: function (callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-all-workspaces'
                    }, {
                        success: callback
                    });
                },
                setUserWorkspace: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/set-user-workspace/' + workspaceId
                    }, {
                        success: callback
                    });
                },
                getAllUsers: function (callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-all-users'
                    }, {
                        success: callback
                    });
                },
                getPermittedWorkspaces: function (callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-permitted-workspaces'
                    }, {
                        success: callback
                    });
                },
                getAllUsersWithPermissions: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-all-users-with-permissions/' + workspaceId
                    }, {
                        success: callback
                    });
                },
                setUsersPermissionsForWorkspace: function (workspaceId, collection, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/set-users-permissions-for-workspace/' + workspaceId,
                        data: {
                            collection: collection
                        }
                    }, {
                        success: callback
                    });
                },
                getUsers: function (ids, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/get-users',
                        data: {
                            ids: ids
                        }
                    }, {
                        success: callback
                    });
                },
                getUser: function (userId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-user/' + userId
                    }, {
                        success: callback
                    });
                },
                getWorkspace: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-workspace/' + workspaceId
                    }, {
                        success: callback
                    });
                },
                getDefaultWorkspaceId: function (userId, callback) {
                    httpClientService.sendRequest({
                        method: 'GET',
                        url: '/api/get-default-workspace-id/' + userId
                    }, {
                        success: callback
                    });
                },
                createWorkspace: function (workspaceName, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: '/api/create-workspace',
                        data: {
                            workspaceName: workspaceName
                        }
                    }, {
                        success: callback
                    });
                }
            };
        }
    ]
);