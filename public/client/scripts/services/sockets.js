"use strict";

angular.module('application')

    .service('socketsService', [

        '$rootScope',

        function ($rootScope) {

            var socket = null;
            var socketConnection = null;

            var isConnected = false;

            function closeConnection() {
                isConnected = false;

                if (socket) {
                    return socket.close();
                }
            }

            function getSocketConnection(userId, emit) {
                return  {
                    changedWorkspace: function (workspaceId) {
                        emit('changed_workspace', {
                            userId: userId,
                            workspaceId: workspaceId
                        });
                    },
                    removedWorkspace: function (workspaceId) {
                        emit('workspace_removed', {
                            userId: userId,
                            workspaceId: workspaceId
                        });
                    },
                    updatedWorkspace: function (workspaceId, data) {
                        emit('workspace_updated', {
                            userId: userId,
                            workspaceId: workspaceId,
                            data: data
                        });
                    },
                    addedItem: function (item) {
                        emit('added_item', {
                            userId: userId,
                            item: item
                        });
                    },
                    updatedItems: function (items) {
                        emit('updated_items', {
                            userId: userId,
                            items: items
                        });
                    },
                    removedItems: function (itemIds) {
                        emit('removed_items', {
                            userId: userId,
                            itemIds: itemIds
                        });
                    },
                    permissionsChanged: function (collection, workspaceId) {
                        emit('permissions_changed', {
                            userId: userId,
                            workspaceId: workspaceId,
                            collection: collection
                        });
                    },
                    updatePresentUsers: function (workspaceId) {
                        emit('update_present_users', {
                            userId: userId,
                            workspaceId: workspaceId
                        });
                    }
                };
            }

            return {
                openCollection: function (options, callback) {

                    var url = options.url;
                    var userId = options.userId;
                    var workspaceId = options.workspaceId;

                    if (isConnected) {
                        callback(socketConnection);
                    } else {
                        socket = io(url, {
                            'force new connection': true
                        });

                        _.forEach({
                            'user_connected': 'userConnected',
                            'user_disconnected': 'userDisconnected',

                            'changed_workspace': 'changedWorkspace',
                            'updated_workspace': 'updatedWorkspace',
                            'removed_workspace': 'removedWorkspace',

                            'added_item': 'addedItem',
                            'updated_items': 'updatedItems',
                            'removed_items': 'removedItems',

                            'permissions_changed': 'permissionsChanged',

                            'update_present_users': 'updatePresentUsers'
                        }, function (value, command) {
                            socket.on(command, function (data) {
                                $rootScope.$broadcast('socketsService:' + value, data);
                            });
                        });

                        var emit = function (command, data) {
                            if (isConnected) {
                                socket.emit(command, data);
                            } else {
                                throw 'Connection closed';
                            }
                        };

                        socket.on('connect', function (data) {
                            isConnected = true;

                            emit('user_connection', {
                                userId: userId,
                                workspaceId: workspaceId
                            });

                            socketConnection = getSocketConnection(userId, emit);
                            callback(socketConnection);
                        });

                        socket.on('disconnect', function (data) {
                            if (isConnected) {
                                closeConnection();
                                $rootScope.$broadcast('socketsService:disconnect', data);
                            }
                        });

                        socket.on('error', function (error) {
                            $rootScope.$broadcast('socketsService:error', error);
                        });
                    }
                },
                closeConnection: function () {
                    closeConnection();
                }
            };
        }
    ]
);