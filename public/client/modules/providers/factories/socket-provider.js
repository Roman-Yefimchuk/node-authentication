"use strict";

providers.factory('socketProvider', [

    'notificationProvider',

    function (notificationProvider) {
        return {
            openCollection: function (url, $scope, workspaceId) {
                var userId = $scope.userId;
                var socket = io.connect(url);

                function sendCommand(command, data) {
                    socket.emit(command, data);
                }

                function onCommand(command, callback) {
                    socket.on(command, function (data) {
                        callback(data);
                    });
                }

                function getWorkspaceId() {
                    return $scope.currentWorkspace['id'];
                }

                onCommand('user_connected', function (data) {
                    $scope.presentUsers = data.presentUsers;
                });

                onCommand('changed_workspace', function (data) {
                    var userId = data.userId;
                    var workspaceId = data.workspaceId;

                    if (workspaceId == getWorkspaceId()) {
                        $scope.userJoined(userId, function (user) {
                            notificationProvider.success('User ' + user.displayName + ' joined to workspace');
                        });
                    } else {
                        $scope.userHasLeft(userId, function (user) {
                            notificationProvider.info('User ' + user.displayName + ' has left workspace');
                        });
                    }
                });

                onCommand('added_item', function (data) {
                    var userId = data.userId;
                    var item = data.item;
                    $scope.addedItem(userId, item);
                });

                onCommand('updated_items', function (data) {
                    var userId = data.userId;
                    var items = data.items;
                    $scope.updatedItems(userId, items);
                });

                onCommand('removed_items', function (data) {
                    var userId = data.userId;
                    var itemIds = data.itemIds;
                    $scope.removedItems(userId, itemIds);
                });

                onCommand('permissions_changed', function (data) {
                    var userId = data.userId;
                    var workspaceId = data.workspaceId;
                    if (data.access) {
                        var permissions = data.permissions;
                        $scope.updatePermissions(userId, workspaceId, permissions);
                    } else {
                        $scope.closeAccess(userId, workspaceId);
                    }
                });

                onCommand('update_present_users', function (data) {
                    $scope.presentUsers = data.presentUsers;
                });

                onCommand('user_disconnected', function (data) {
                    var userId = data.userId;
                    $scope.userHasLeft(userId, function (user) {
                        notificationProvider.info('User ' + user.displayName + ' disconnected');
                    });
                });

                onCommand('disconnect', function () {
                    socket.disconnect();
                    notificationProvider.error('You lost connection');
                });

                sendCommand('user_connection', {
                    userId: $scope.userId,
                    workspaceId: workspaceId
                });

                return {
                    changedWorkspace: function () {
                        sendCommand('changed_workspace', {
                            userId: userId,
                            workspaceId: getWorkspaceId()
                        });
                    },
                    addedItem: function (item) {
                        sendCommand('added_item', {
                            userId: userId,
                            item: item
                        });
                    },
                    updatedItems: function (items) {
                        sendCommand('updated_items', {
                            userId: userId,
                            items: items
                        });
                    },
                    removedItems: function (itemIds) {
                        sendCommand('removed_items', {
                            userId: userId,
                            itemIds: itemIds
                        });
                    },
                    permissionsChanged: function (collection) {
                        sendCommand('permissions_changed', {
                            userId: userId,
                            workspaceId: getWorkspaceId(),
                            collection: collection
                        });
                    },
                    updatePresentUsers: function () {
                        sendCommand('update_present_users', {
                            userId: userId,
                            workspaceId: getWorkspaceId()
                        });
                    }
                };
            }
        };
    }
]);