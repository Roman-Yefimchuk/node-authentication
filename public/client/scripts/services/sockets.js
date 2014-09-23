"use strict";

angular.module('application')

    .service('socketsService', [

        '$rootScope',
        '$log',
        'DEBUG_MODE',

        function ($rootScope, $log, DEBUG_MODE) {

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
                    updatedWorkspace: function (workspaceId, data) {
                        emit('updated_workspace', {
                            userId: userId,
                            workspaceId: workspaceId,
                            data: data
                        });
                    },
                    removedWorkspace: function (workspaceId, result) {
                        emit('removed_workspace', {
                            userId: userId,
                            workspaceId: workspaceId,
                            result: result
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
                    permissionsChanged: function (accessResultCollection, workspaceId, parentWorkspaceId) {
                        emit('permissions_changed', {
                            userId: userId,
                            workspaceId: workspaceId,
                            parentWorkspaceId: parentWorkspaceId,
                            accessResultCollection: accessResultCollection
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

                        var emit = function (command, data) {
                            if (isConnected) {

                                if (DEBUG_MODE) {
                                    $log.debug('SOCKET >>> [' + command + ']');
                                    $log.debug(data);
                                }

                                socket.emit(command, data);
                            } else {
                                throw 'Connection closed';
                            }
                        };

                        var on = function (command, handler) {
                            if (DEBUG_MODE) {
                                socket.on(command, function (data) {
                                    $log.debug('SOCKET <<< [' + command + ']');
                                    $log.debug(data);

                                    handler(data);
                                });
                            } else {
                                socket.on(command, handler);
                            }
                        };

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
                            on(command, function (data) {
                                $rootScope.$broadcast('socketsService:' + value, data);
                            });
                        });

                        on('connect', function (data) {
                            isConnected = true;

                            emit('user_connection', {
                                userId: userId,
                                workspaceId: workspaceId
                            });

                            socketConnection = getSocketConnection(userId, emit);
                            callback(socketConnection);
                        });

                        on('disconnect', function (data) {
                            if (isConnected) {
                                closeConnection();
                                $rootScope.$broadcast('socketsService:disconnect', data);
                            }
                        });

                        on('error', function (error) {
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