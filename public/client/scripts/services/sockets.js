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
                        emit(SocketCommands.CHANGED_WORKSPACE, {
                            userId: userId,
                            workspaceId: workspaceId
                        });
                    },
                    updatedWorkspace: function (workspaceId, data) {
                        emit(SocketCommands.UPDATED_WORKSPACE, {
                            userId: userId,
                            workspaceId: workspaceId,
                            data: data
                        });
                    },
                    removedWorkspace: function (workspaceId, result) {
                        emit(SocketCommands.REMOVED_WORKSPACE, {
                            userId: userId,
                            workspaceId: workspaceId,
                            result: result
                        });
                    },
                    addedItem: function (item) {
                        emit(SocketCommands.ADDED_ITEM, {
                            userId: userId,
                            item: item
                        });
                    },
                    updatedItem: function (item) {
                        emit(SocketCommands.UPDATED_ITEM, {
                            userId: userId,
                            item: item
                        });
                    },
                    removedItem: function (itemId) {
                        emit(SocketCommands.REMOVED_ITEM, {
                            userId: userId,
                            itemId: itemId
                        });
                    },
                    permissionsChanged: function (accessResultCollection, workspaceId, parentWorkspaceId) {
                        emit(SocketCommands.PERMISSIONS_CHANGED, {
                            userId: userId,
                            workspaceId: workspaceId,
                            parentWorkspaceId: parentWorkspaceId,
                            accessResultCollection: accessResultCollection
                        });
                    },
                    updatePresentUsers: function (workspaceId) {
                        emit(SocketCommands.UPDATE_PRESENT_USERS, {
                            userId: userId,
                            workspaceId: workspaceId
                        });
                    },
                    startLecture: function (lectureId) {
                        emit(SocketCommands.START_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    resumeLecture: function (lectureId) {
                        emit(SocketCommands.RESUME_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    suspendLecture: function (lectureId) {
                        emit(SocketCommands.SUSPEND_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    stopLecture: function (lectureId) {
                        emit(SocketCommands.STOP_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    getLectureDuration: function (lectureId) {
                        emit(SocketCommands.GET_LECTURE_DURATION, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    getTotalLectureDuration: function (lectureId) {
                        emit(SocketCommands.GET_TOTAL_LECTURE_DURATION, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    askQuestion: function (lectureId, question) {
                        emit(SocketCommands.ASK_QUESTION, {
                            userId: userId,
                            lectureId: lectureId,
                            question: question
                        });
                    },
                    updatePresentListeners: function (lectureId) {
                        emit(SocketCommands.UPDATE_PRESENT_LISTENERS, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    joinToLecture: function (lectureId) {
                        emit(SocketCommands.JOIN_TO_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    leftFromLecture: function (lectureId) {
                        emit(SocketCommands.LEFT_FROM_LECTURE, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    getQuestionInfo: function (lectureId, questionId) {
                        emit(SocketCommands.GET_QUESTION_INFO, {
                            userId: userId,
                            lectureId: lectureId,
                            questionId: questionId
                        });
                    },
                    replyForTeacherQuestion: function (lectureId, questionId, answer) {
                        emit(SocketCommands.REPLY_FOR_TEACHER_QUESTION, {
                            userId: userId,
                            lectureId: lectureId,
                            questionId: questionId,
                            answer: answer
                        });
                    },
                    updateStatistic: function (lectureId, value) {
                        emit(SocketCommands.UPDATE_STATISTIC, {
                            userId: userId,
                            lectureId: lectureId,
                            value: value
                        });
                    },
                    sendMessage: function (lectureId, message) {
                        emit(SocketCommands.SEND_MESSAGE, {
                            userId: userId,
                            lectureId: lectureId,
                            message: message
                        });
                    },
                    updateChart: function (lectureId) {
                        emit(SocketCommands.UPDATE_CHART, {
                            userId: userId,
                            lectureId: lectureId
                        });
                    },
                    createdTask: function () {
                    },
                    updatedTasks: function () {
                    },
                    removedTasks: function () {
                    }
                };
            }

            return {
                openConnection: function (options, callback) {

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

                        _.forEach([
                            SocketCommands.USER_CONNECTED,
                            SocketCommands.USER_DISCONNECTED,
                            SocketCommands.CHANGED_WORKSPACE,
                            SocketCommands.UPDATED_WORKSPACE,
                            SocketCommands.REMOVED_WORKSPACE,
                            SocketCommands.ADDED_ITEM,
                            SocketCommands.UPDATED_ITEM,
                            SocketCommands.REMOVED_ITEM,
                            SocketCommands.PERMISSIONS_CHANGED,
                            SocketCommands.UPDATE_PRESENT_USERS,
                            SocketCommands.LECTURE_STARTED,
                            SocketCommands.LECTURE_RESUMED,
                            SocketCommands.LECTURE_SUSPENDED,
                            SocketCommands.LECTURE_STOPPED,
                            SocketCommands.UPDATE_LECTURE_DURATION,
                            SocketCommands.UPDATE_TOTAL_LECTURE_DURATION,
                            SocketCommands.QUESTION_ASKED,
                            SocketCommands.UPDATE_QUESTION_INFO,
                            SocketCommands.UPDATE_PRESENT_LISTENERS,
                            SocketCommands.LISTENER_JOINED,
                            SocketCommands.LISTENER_HAS_LEFT,
                            SocketCommands.ON_MESSAGE,
                            SocketCommands.UPDATE_STATISTIC,
                            SocketCommands.UPDATE_CHART
                        ], function (command) {
                            on(command, function (data) {
                                $rootScope.$broadcast('socketsService:' + command, data);
                            });
                        });

                        on('connect', function () {
                            isConnected = true;

                            emit(SocketCommands.USER_CONNECTION, {
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
                closeConnection: closeConnection
            };
        }
    ]
);