"use strict";

module.exports = function (io, dbProvider, developmentMode) {

    var _ = require('underscore');
    var socketsSession = {};
    var forEach = _.forEach;

    var SocketSession = (function () {

        var closedCounter = 0;

        function SocketSession(socket, userId, workspaceId) {
            this.socket = socket;
            this.userId = userId;
            this.workspaceId = workspaceId;
        }

        SocketSession.prototype.sendCommand = function (command, data) {
            var socket = this.socket;
            socket.emit(command, data);
        };

        SocketSession.prototype.close = function () {
            var socket = this.socket;

            delete socketsSession[socket.id];
            socket.disconnect();

            if (++closedCounter > 100) {
                socketsSession = _.compact(socketsSession);
                closedCounter = 0;
            }
        };

        return SocketSession;
    })();

    function findSocketSessionByUserId(userId) {
        return _.findWhere(socketsSession, {
            userId: userId
        });
    }

    io.on('connection', function (socket) {

        function getSession() {
            return socketsSession[socket.id];
        }

        function createSession(userId, workspaceId) {
            var socketSession = new SocketSession(socket, userId, workspaceId);
            socketsSession[socket.id] = socketSession;
            return socketSession;
        }

        function sendBroadcast(command, data, workspaceId) {
            var currentSocketSession = getSession();

            if (!workspaceId) {
                workspaceId = currentSocketSession.workspaceId;
            }

            forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        socketSession.sendCommand(command, data);
                    }
                }
            });
        }

        function emit(command, data) {
            socket.emit(command, data);
        }

        function on(command, callback) {
            socket.on(command, function (data) {
                callback(data);
            });
        }

        on('user_connection', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;

            createSession(userId, workspaceId);

            var presentUsers = [];

            forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                }
            });

            emit('user_connected', {
                presentUsers: presentUsers
            });
        });

        on('changed_workspace', function (data) {
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

        on('updated_workspace', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;
            var data = data.data;

            sendBroadcast('updated_workspace', {
                userId: userId,
                workspaceId: workspaceId,
                data: data
            });
        });

        on('removed_workspace', function (data) {

            var userId = data.userId;
            var workspaceId = data.workspaceId;
            var result = data.result;

            var workspaceName = result.workspaceName;
            var topLevelWorkspaceIdCollection = result.topLevelWorkspaceIdCollection;

            forEach(topLevelWorkspaceIdCollection, function (item) {
                var topLevelWorkspaceId = item.topLevelWorkspaceId;
                var socketSession = findSocketSessionByUserId(item.userId);

                if (socketSession) {
                    socketSession.sendCommand('removed_workspace', {
                        userId: userId,
                        workspaceId: workspaceId,
                        workspaceName: workspaceName,
                        topLevelWorkspaceId: topLevelWorkspaceId
                    });
                }
            });
        });

        on('added_item', function (data) {
            var userId = data.userId;
            var item = data.item;

            sendBroadcast('added_item', {
                userId: userId,
                item: item
            });
        });

        on('updated_items', function (data) {
            var userId = data.userId;
            var items = data.items;

            sendBroadcast('updated_items', {
                userId: userId,
                items: items
            });
        });

        on('removed_items', function (data) {
            var userId = data.userId;
            var itemIds = data.itemIds;

            sendBroadcast('removed_items', {
                userId: userId,
                itemIds: itemIds
            });
        });

        on('permissions_changed', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;
            var parentWorkspaceId = data.parentWorkspaceId || '@root';
            var accessResultCollection = data.accessResultCollection;

            forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {

                    var accessData = _.findWhere(accessResultCollection, {
                        userId: socketSession.userId
                    });

                    if (accessData) {

                        socketSession.sendCommand('permissions_changed', {
                            userId: userId,
                            workspaceId: workspaceId,
                            parentWorkspaceId: parentWorkspaceId,
                            accessData: accessData
                        });
                    }
                }
            });
        });

        on('update_present_users', function (data) {
            var userId = data.userId;
            var workspaceId = data.workspaceId;

            var presentUsers = [];

            forEach(socketsSession, function (socketSession, sessionId) {
                if (socketSession && sessionId != socket.id) {
                    if (socketSession.workspaceId == workspaceId) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                }
            });

            emit('update_present_users', {
                presentUsers: presentUsers
            });
        });

        on('disconnect', function () {
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