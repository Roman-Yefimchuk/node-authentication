"use strict";

angular.module('application')

    .service('socketsService', [

        '$rootScope',

        function ($rootScope) {

            var socket = null;

            var connection = null;

            function closeConnection() {
                connection = null;

                if (socket) {
                    return socket.close();
                }
            }

            return {
                openCollection: function (url, userId, workspaceId) {
                    if (connection) {
                        return connection;
                    } else {
                        socket = io.connect(url);

                        _.forEach({
                            'user_connected': 'userConnected',
                            'user_disconnected': 'userDisconnected',

                            'changed_workspace': 'changedWorkspace',

                            'added_item': 'addedItem',
                            'updated_items': 'updatedItems',
                            'removed_items': 'removedItems',

                            'permissions_changed': 'permissionsChanged',

                            'update_present_users': 'updatePresentUsers',

                            'disconnect': 'disconnect'
                        }, function (value, command) {
                            socket.on(command, function (data) {
                                if (command == 'disconnect' && connection) {

                                    closeConnection();

                                    $rootScope.$broadcast('socketsService:' + value, data);
                                } else {
                                    $rootScope.$broadcast('socketsService:' + value, data);
                                }
                            });
                        });

                        connection = {
                            changedWorkspace: function (workspaceId) {
                                emit('changed_workspace', {
                                    userId: userId,
                                    workspaceId: workspaceId
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

                        var emit = function (command, data) {
                            if (connection) {
                                socket.emit(command, data);
                            } else {
                                throw 'Connection closed';
                            }
                        };

                        emit('user_connection', {
                            userId: userId,
                            workspaceId: workspaceId
                        });

                        return connection;
                    }
                },
                closeConnection: function () {
                    closeConnection();
                }
            };
        }
    ]
);