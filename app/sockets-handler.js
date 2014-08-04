module.exports = function (io, dbProvider, developmentMode) {

    var socketsSession = {};
    var _ = require('underscore');

    io.on('connection', function (socket) {

        function getSession() {
            return socketsSession[socket.id];
        }

        function createSession(userId, workspaceId) {
            socketsSession[socket.id] = {
                userId: userId,
                workspaceId: workspaceId,
                sendCommand: function (command, data) {
                    socket.emit(command, data);
                },
                close: function () {
                    delete socketsSession[socket.id];
                    socket.disconnect();
                }
            };
        }

        function sendBroadcast(command, data, workspaceId) {
            var currentSocketSession = getSession();

            if (!workspaceId) {
                workspaceId = currentSocketSession.workspaceId;
            }

            _.forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        socketSession.sendCommand(command, data);
                    }
                }
            });
        }

        function sendCommand(command, data) {
            socket.emit(command, data);
        }

        function onCommand(command, callback) {
            socket.on(command, function (data) {
                callback(data);
            });
        }

        onCommand('user_connection', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;

            createSession(userId, workspaceId);

            var presentUsers = [];

            _.forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                }
            });

            sendCommand('user_connected', {
                presentUsers: presentUsers
            });
        });

        onCommand('changed_workspace', function (data) {
            var session = getSession();

            if (session) {
                var userId = data.userId;
                var workspaceId = data.workspaceId;
                var previousWorkspaceId = session.workspaceId;

                session.workspaceId = workspaceId;

                sendBroadcast('changed_workspace', {
                    userId: userId,
                    workspaceId: workspaceId
                });

                if (previousWorkspaceId && previousWorkspaceId != workspaceId) {
                    sendBroadcast('changed_workspace', {
                        userId: userId,
                        workspaceId: workspaceId
                    }, previousWorkspaceId);
                }
            }
        });

        onCommand('added_item', function (data) {
            var userId = data.userId;
            var item = data.item;
            sendBroadcast('added_item', {
                userId: userId,
                item: item
            });
        });

        onCommand('updated_items', function (data) {
            var userId = data.userId;
            var items = data.items;
            sendBroadcast('updated_items', {
                userId: userId,
                items: items
            });
        });

        onCommand('removed_items', function (data) {
            var userId = data.userId;
            var itemIds = data.itemIds;
            sendBroadcast('removed_items', {
                userId: userId,
                itemIds: itemIds
            });
        });

        onCommand('permissions_changed', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;
            var collection = data.collection;

            function isAccessDenied(permissions) {
                return !permissions.readOnly && !permissions.collectionManager && !permissions.accessManager;
            }

            dbProvider.setUsersPermissionsForWorkspace(workspaceId, collection, function () {

                _.forEach(socketsSession, function (socketSession, sessionId) {
                    if (socketSession && sessionId != socket.id) {

                        var collectionItem = _.findWhere(collection, {
                            'userId': socketSession.userId
                        });

                        var permissions = collectionItem.permissions;

                        if (isAccessDenied(permissions)) {
                            socketSession.sendCommand('permissions_changed', {
                                userId: userId,
                                workspaceId: workspaceId,
                                access: false
                            });
                        } else {
                            socketSession.sendCommand('permissions_changed', {
                                userId: userId,
                                workspaceId: workspaceId,
                                access: true,
                                permissions: permissions
                            });
                        }
                    }
                });
            });
        });

        onCommand('update_present_users', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;

            var presentUsers = [];

            _.forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                }
            });

            sendCommand('update_present_users', {
                presentUsers: presentUsers
            });
        });

        onCommand('disconnect', function () {
            var session = getSession();
            if (session) {
                var userId = session.userId;

                sendBroadcast('user_disconnected', {
                    userId: userId
                });

                session.close();
            }
        });
    });
};