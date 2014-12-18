"use strict";

module.exports = function (io, dbProvider) {

    var _ = require('underscore');

    var SocketCommands = require('../../public/common-scripts/socket-commands');

    var ListenerSession = require('../socket/sessions/listener-session')();
    var SocketSession = require('../socket/sessions/socket-session')(ListenerSession);
    var LectureSession = require('../socket/sessions/lecture-session')(dbProvider);

    io.on('connection', function (socket) {

        function getSocketSession() {
            var id = socket.id;
            return SocketSession.findById(id);
        }

        function emit(command, data) {
            socket.emit(command, data);
        }

        function on(command, callback) {
            socket.on(command, function (data) {
                callback(data);
            });
        }

        on('disconnect', function () {

            var socketSession = getSocketSession();
            if (socketSession) {

                broadcast(SocketCommands.USER_DISCONNECTED, {
                    userId: socketSession.userId
                });

                socketSession.close();
            }
        });

        function broadcast(command, data, workspaceId) {
            var currentSocketSession = getSocketSession();

            workspaceId = workspaceId || currentSocketSession.workspaceId;

            SocketSession.each(function (socketSession) {
                var sessionId = socketSession.socket['id'];
                if (socketSession.workspaceId == workspaceId && sessionId != socket.id) {
                    socketSession.sendCommand(command, data);
                }
            });
        }

        (function () {

            on(SocketCommands.USER_CONNECTION, function (data) {

                var userId = data.userId;
                var workspaceId = data.workspaceId;
                var presentUsers = [];

                new SocketSession(socket, userId, workspaceId);

                SocketSession.each(function (socketSession) {
                    var sessionId = socketSession.socket['id'];
                    if (socketSession.workspaceId == workspaceId && sessionId != socket.id) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                });

                emit(SocketCommands.USER_CONNECTED, {
                    presentUsers: presentUsers
                });
            });

            on(SocketCommands.CHANGED_WORKSPACE, function (data) {

                var socketSession = getSocketSession();
                if (socketSession) {

                    var userId = data.userId;
                    var workspaceId = data.workspaceId;
                    var previousWorkspaceId = socketSession.workspaceId;

                    socketSession.workspaceId = workspaceId;

                    broadcast(SocketCommands.CHANGED_WORKSPACE, {
                        userId: userId,
                        workspaceId: workspaceId
                    });

                    if (previousWorkspaceId && previousWorkspaceId != workspaceId) {
                        broadcast(SocketCommands.CHANGED_WORKSPACE, {
                            userId: userId,
                            workspaceId: workspaceId
                        }, previousWorkspaceId);
                    }
                }
            });

            on(SocketCommands.UPDATED_WORKSPACE, function (data) {

                var userId = data.userId;
                var workspaceId = data.workspaceId;
                var data = data.data;

                broadcast(SocketCommands.UPDATED_WORKSPACE, {
                    userId: userId,
                    workspaceId: workspaceId,
                    data: data
                });
            });

            on(SocketCommands.REMOVED_WORKSPACE, function (data) {

                var userId = data.userId;
                var workspaceId = data.workspaceId;
                var result = data.result;

                var workspaceName = result.workspaceName;
                var topLevelWorkspaceIdCollection = result.topLevelWorkspaceIdCollection;

                _.forEach(topLevelWorkspaceIdCollection, function (item) {

                    var topLevelWorkspaceId = item.topLevelWorkspaceId;
                    var socketSession = SocketSession.findByUserId(item.userId);

                    if (socketSession) {
                        socketSession.sendCommand(SocketCommands.REMOVED_WORKSPACE, {
                            userId: userId,
                            workspaceId: workspaceId,
                            workspaceName: workspaceName,
                            topLevelWorkspaceId: topLevelWorkspaceId
                        });
                    }
                });
            });

            on(SocketCommands.PERMISSIONS_CHANGED, function (data) {

                var userId = data.userId;
                var workspaceId = data.workspaceId;
                var parentWorkspaceId = data.parentWorkspaceId || '@root';
                var accessResultCollection = data.accessResultCollection;

                SocketSession.each(function (socketSession) {

                    var sessionId = socketSession.socket['id'];
                    if (sessionId != socket.id) {

                        var accessData = _.findWhere(accessResultCollection, {
                            userId: socketSession.userId
                        });

                        if (accessData) {
                            socketSession.sendCommand(SocketCommands.PERMISSIONS_CHANGED, {
                                userId: userId,
                                workspaceId: workspaceId,
                                parentWorkspaceId: parentWorkspaceId,
                                accessData: accessData
                            });
                        }
                    }
                });
            });

            on(SocketCommands.UPDATE_PRESENT_USERS, function (data) {

                var workspaceId = data.workspaceId;
                var presentUsers = [];

                SocketSession.each(function (socketSession) {

                    var sessionId = socketSession.socket['id'];
                    if (socketSession.workspaceId == workspaceId && sessionId != socket.id) {
                        var userId = socketSession.userId;
                        presentUsers.push(userId);
                    }
                });

                emit(SocketCommands.UPDATE_PRESENT_USERS, {
                    presentUsers: presentUsers
                });
            });

            (function () {

                on(SocketCommands.ADDED_ITEM, function (data) {

                    var userId = data.userId;
                    var item = data.item;

                    broadcast(SocketCommands.ADDED_ITEM, {
                        userId: userId,
                        item: item
                    });
                });

                on(SocketCommands.UPDATED_ITEM, function (data) {

                    var userId = data.userId;
                    var item = data.item;

                    broadcast(SocketCommands.UPDATED_ITEM, {
                        userId: userId,
                        item: item
                    });
                });

                on(SocketCommands.REMOVED_ITEM, function (data) {

                    var userId = data.userId;
                    var itemId = data.itemId;

                    broadcast(SocketCommands.REMOVED_ITEM, {
                        userId: userId,
                        itemId: itemId
                    });
                });

            })();

            (function () {

                on(SocketCommands.TASK_CREATED, function (data) {

                    var userId = data.userId;
                    var task = data.task;

                    broadcast(SocketCommands.TASK_CREATED, {
                        userId: userId,
                        task: task
                    });
                });

                on(SocketCommands.TASKS_UPDATED, function (data) {

                    var userId = data.userId;
                    var tasks = data.tasks;

                    broadcast(SocketCommands.TASKS_UPDATED, {
                        userId: userId,
                        tasks: tasks
                    });
                });

                on(SocketCommands.TASKS_REMOVED, function (data) {

                    var userId = data.userId;
                    var tasksIds = data.tasksIds;

                    broadcast(SocketCommands.TASKS_REMOVED, {
                        userId: userId,
                        tasksIds: tasksIds
                    });
                });

            })();

        })();

        (function () {

            function echo(command, data) {
                SocketSession.each(function (socketSession) {
                    socketSession.sendCommand(command, data);
                });
            }

            function broadcast(command, data, lectureId) {

                var currentSocketSession = getSocketSession();

                if (lectureId) {
                    var lectureSession = LectureSession.findById(lectureId);
                    if (lectureSession) {
                        _.forEach(lectureSession.listeners, function (listenerSession) {
                            if (listenerSession.userId != currentSocketSession.userId) {
                                var socketSession = listenerSession.socketSession;
                                socketSession.sendCommand(command, data);
                            }
                        });
                    }
                } else {
                    SocketSession.each(function (socketSession) {
                        var sessionId = socketSession.socket['id'];
                        if (socketSession.workspaceId == currentSocketSession.workspaceId && sessionId != socket.id) {
                            socketSession.sendCommand(command, data);
                        }
                    });
                }
            }

            on(SocketCommands.START_LECTURE, function (data) {

                var lectureId = data.lectureId;
                var lecturerId = data.userId;

                var lectureSession = new LectureSession(lectureId, lecturerId);
                lectureSession.startLecture(function (lecture) {
                    echo(SocketCommands.LECTURE_STARTED, {
                        lectureId: lectureId,
                        lecturerId: lecturerId
                    });
                });
            });

            on(SocketCommands.RESUME_LECTURE, function (data) {

                var lectureId = data.lectureId;
                var lecturerId = data.userId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    lectureSession.resumeLecture(function (lecture) {
                        echo(SocketCommands.LECTURE_RESUMED, {
                            lectureId: lectureId,
                            lecturerId: lecturerId
                        });
                    });
                }
            });

            on(SocketCommands.SUSPEND_LECTURE, function (data) {

                var lectureId = data.lectureId;
                var lecturerId = data.userId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    lectureSession.suspendLecture(function (lecture) {
                        echo(SocketCommands.LECTURE_SUSPENDED, {
                            lectureId: lectureId,
                            lecturerId: lecturerId
                        });
                    });
                }
            });

            on(SocketCommands.STOP_LECTURE, function (data) {

                var lectureId = data.lectureId;
                var lecturerId = data.userId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    lectureSession.stopLecture(function (lecture) {
                        echo(SocketCommands.LECTURE_STOPPED, {
                            lectureId: lectureId,
                            lecturerId: lecturerId
                        });
                    });
                }
            });

            on(SocketCommands.GET_LECTURE_DURATION, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    emit(SocketCommands.UPDATE_LECTURE_DURATION, {
                        lectureId: lectureId,
                        duration: lectureSession.getDuration()
                    });
                }
            });

            on(SocketCommands.GET_TOTAL_LECTURE_DURATION, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    emit(SocketCommands.UPDATE_TOTAL_LECTURE_DURATION, {
                        lectureId: lectureId,
                        totalDuration: lectureSession.getTotalDuration()
                    });
                }
            });

            on(SocketCommands.GET_QUESTION_INFO, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;
                var questionId = data.questionId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {

                    var question = lectureSession.teacherQuestions[questionId];
                    if (question) {
                        emit(SocketCommands.UPDATE_QUESTION_INFO, {
                            isAsked: true,
                            questionId: questionId,
                            answers: question.answers
                        });
                    } else {
                        emit(SocketCommands.UPDATE_QUESTION_INFO, {
                            isAsked: false,
                            questionId: questionId
                        });
                    }
                }
            });

            on(SocketCommands.SEND_MESSAGE, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;
                var message = data.message;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    broadcast(SocketCommands.ON_MESSAGE, {
                        userId: userId,
                        message: message
                    }, lectureSession.id);
                }
            });

            on(SocketCommands.UPDATE_CHART, function (data) {

                var lectureId = data.lectureId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    emit(SocketCommands.UPDATE_CHART, lectureSession.chartPoints);
                }
            });

            on(SocketCommands.REPLY_FOR_TEACHER_QUESTION, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;
                var questionId = data.questionId;
                var answer = data.answer;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {

                    var question = lectureSession.teacherQuestions[questionId];
                    if (question) {

                        var answers = question.answers;
                        answers.push({
                            userId: userId,
                            answer: answer
                        });
                    } else {
                        question = {
                            answers: [
                                {
                                    userId: userId,
                                    answer: answer
                                }
                            ]
                        };
                        lectureSession.teacherQuestions[questionId] = question;
                    }

                    broadcast(SocketCommands.UPDATE_QUESTION_INFO, {
                        isAsked: true,
                        questionId: questionId,
                        answers: question.answers
                    }, lectureId);

                    dbProvider.getLectureById(lectureId, function (lecture) {
                        var authorId = lecture.authorId;

                        var socketSession = SocketSession.findByUserId(authorId);
                        if (socketSession) {
                            socketSession.sendCommand(SocketCommands.UPDATE_QUESTION_INFO, {
                                isAsked: true,
                                questionId: questionId,
                                answers: question.answers
                            });
                        }
                    });
                }
            });

            on(SocketCommands.ASK_QUESTION, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;
                var question = data.question;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {
                    var questionId = question.id;

                    if (!lectureSession.teacherQuestions[questionId]) {
                        lectureSession.teacherQuestions[questionId] = {
                            isAsked: true,
                            answers: []
                        };
                    }

                    broadcast(SocketCommands.QUESTION_ASKED, {
                        lectureId: lectureId,
                        question: question
                    }, lectureId);
                }
            });

            on(SocketCommands.UPDATE_STATISTIC, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;
                var value = data.value;

                var listenerSession = ListenerSession.findByUserId(userId);
                if (listenerSession) {

                    listenerSession.requestCount++;
                    listenerSession.understandingValue += value;

                    var data = {
                        lectureId: lectureId,
                        understandingValue: (function () {
                            var lectureSession = LectureSession.findById(lectureId);
                            if (lectureSession) {
                                return lectureSession.getAverageUnderstandingValue();
                            }
                            return 0;
                        })()
                    };

                    broadcast(SocketCommands.UPDATE_STATISTIC, data);
                    emit(SocketCommands.UPDATE_STATISTIC, data)
                }
            });

            on(SocketCommands.UPDATE_PRESENT_LISTENERS, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;

                var lectureSession = LectureSession.findById(lectureId);
                if (lectureSession) {

                    var presentListeners = [];

                    _.forEach(lectureSession.listeners, function (listenerSession) {
                        var userId = listenerSession.userId;
                        presentListeners.push(userId);
                    });

                    emit(SocketCommands.UPDATE_PRESENT_LISTENERS, {
                        lectureId: lectureId,
                        presentListeners: presentListeners
                    });
                }
            });

            on(SocketCommands.JOIN_TO_LECTURE, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;

                var lectureSession = LectureSession.findById(lectureId);
                var socketSession = SocketSession.findByUserId(userId);

                if (lectureSession && socketSession) {

                    var listenerSession = new ListenerSession(userId, lectureSession, socketSession);
                    listenerSession.join();

                    broadcast(SocketCommands.LISTENER_JOINED, {
                        userId: userId,
                        lectureId: lectureId
                    });
                }
            });

            on(SocketCommands.LEFT_FROM_LECTURE, function (data) {

                var userId = data.userId;
                var lectureId = data.lectureId;

                var listenerSession = ListenerSession.findByUserId(userId);
                if (listenerSession) {

                    listenerSession.leave();

                    broadcast(SocketCommands.LISTENER_HAS_LEFT, {
                        userId: userId,
                        lectureId: lectureId
                    });
                }
            });

        })();
    });
};