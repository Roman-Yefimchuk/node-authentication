"use strict";

angular.module('application')

    .controller('LecturesController', [

        '$scope',
        '$rootScope',
        '$location',
        '$timeout',
        '$interval',
        'apiService',
        'socketsService',
        'notificationsService',
        'filterFilter',
        'userService',
        'loaderService',
        'dialogsService',
        'translatorService',

        function ($scope, $rootScope, $location, $timeout, $interval, apiService, socketsService, notificationsService, filterFilter, userService, loaderService, dialogsService, translatorService) {

            var notificationsTranslator = translatorService.getSector('home.notifications');

            var lectureModel = {
                title: ''
            };
            var activeLectures = [];

            function getWorkspaceId() {
                return $scope.getWorkspaceId();
            }

            function setFocus() {
                var input = angular.element('#main-input');
                input.focus();
            }

            function canManageLecture(lecture) {
                if ($scope.canManageCollection()) {
                    if (lecture.condition['status'] == 'stopped') {
                        return true;
                    }
                    return lecture.condition['lecturerId'] == $scope.user['userId'];
                }
                return false;
            }

            function addedLecture(userId, lecture) {
                changeNotification(userId, function (userName) {

                    $scope.lectures.push(lecture);

                    return notificationsTranslator.format('user_added_lecture', {
                        userName: userName
                    });
                });
            }

            function updatedLecture(userId, lecture) {
                changeNotification(userId, function (userName) {

                    _.findWhere($scope.lectures, {
                        id: lecture.id
                    }).title = lecture.title;

                    return notificationsTranslator.format('user_updated_lecture', {
                        userName: userName
                    });
                });
            }

            function removedLecture(userId, lectureId) {
                changeNotification(userId, function (userName) {

                    $scope.lectures = _.filter($scope.lectures, function (lecture) {
                        return lecture.id != lectureId;
                    });

                    return notificationsTranslator.format('user_removed_lecture', {
                        userName: userName
                    });
                });
            }

            function addLecture() {
                var title = lectureModel['title'].trim();
                if (!title.length) {
                    return;
                }

                var lecture = {
                    title: title,
                    authorId: $scope.user['userId'],
                    workspaceId: getWorkspaceId(),
                    description: '',
                    tags: [],
                    condition: {
                        status: 'stopped'
                    }
                };

                apiService.createLecture(lecture, function (response) {
                    lecture.id = response.lectureId;
                    lecture.creationDate = response.creationDate;

                    $scope.lectures.push(lecture);
                    lectureModel.title = '';

                    var socketConnection = $scope.socketConnection;
                    socketConnection.addedItem(lecture);

                    setFocus();
                });
            }

            function removeLecture(lecture) {
                apiService.removeLecture(lecture.id, function () {

                    $scope.lectures = _.without($scope.lectures, lecture);

                    var socketConnection = $scope.socketConnection;
                    socketConnection.removedItem(lecture.id);
                });
            }

            function showItemEditor(lecture) {
                dialogsService.showItemEditor({
                    item: lecture,
                    onUpdate: function (lecture, closeCallback) {
                        apiService.updateLecture(lecture.id, lecture, function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedItem(lecture);

                            closeCallback();
                        });
                    }
                });
            }

            function changeNotification(userId, messageBuilder, type) {
                if (!type) {
                    type = 'info';
                }

                apiService.getUser(userId, function (user) {
                    var userName = user.displayName;

                    var message = messageBuilder(userName);
                    notificationsService.notify(message, type);
                });
            }

            function findActiveLectureById(lectureId) {
                return _.findWhere(activeLectures, {
                    lectureId: lectureId
                });
            }

            function findLectureById(lectureId) {
                return _.findWhere($scope.lectures, {
                    id: lectureId
                });
            }

            function subscribeForSocketEvent() {

                $scope.$on('socketsService:' + SocketCommands.ADDED_ITEM, function (event, data) {
                    addedLecture(data['userId'], data['item']);
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATED_ITEM, function (event, data) {
                    updatedLecture(data['userId'], data['item']);
                });

                $scope.$on('socketsService:' + SocketCommands.REMOVED_ITEM, function (event, data) {
                    removedLecture(data['userId'], data['itemId']);
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STARTED, function (event, data) {
                    var lecturerId = data['lecturerId'];
                    var lectureId = data['lectureId'];
                    var lecture = findLectureById(lectureId);
                    lecture.condition = {
                        status: 'started',
                        lecturerId: lecturerId
                    };

                    if (canManageLecture(lecture)) {
                        $location.path("/lectures/lecture-board/" + lectureId);
                    } else {
                        var activeLecture = getActiveLecture(lecture);
                        activeLectures.push(activeLecture);
                        activeLecture.startTimer(function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.getLectureDuration(lectureId);
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_RESUMED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        var lecture = activeLecture.lecture;
                        lecture.condition['status'] = 'started';
                        activeLecture.startTimer(function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.getLectureDuration(lectureId);
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_SUSPENDED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        var lecture = activeLecture.lecture;
                        lecture.condition['status'] = 'suspended';
                        activeLecture.stopTimer();
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STOPPED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {

                        var lecture = activeLecture.lecture;
                        lecture.condition = {
                            status: 'stopped'
                        };

                        activeLecture.stopTimer();

                        activeLectures = _.without(activeLectures, activeLecture);
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_LECTURE_DURATION, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        $timeout(function () {
                            activeLecture.duration = data['duration'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_PRESENT_LISTENERS, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        $timeout(function () {
                            activeLecture.presentListeners = data['presentListeners'];
                        });
                    }
                });
            }

            function startLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.startLecture(lecture.id);
            }

            function resumeLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.resumeLecture(lecture.id);
            }

            function suspendLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.suspendLecture(lecture.id);
            }

            function stopLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.stopLecture(lecture.id);
            }

            function getLectureDuration(lecture) {
                var lectureId = lecture.id;
                var activeLecture = findActiveLectureById(lectureId);
                if (activeLecture) {
                    return activeLecture.duration;
                }
                return 0;
            }

            function getPresentListenersCount(lecture) {
                var lectureId = lecture.id;
                var activeLecture = findActiveLectureById(lectureId);
                if (activeLecture) {
                    return activeLecture.presentListeners['length'];
                }
                return 0;
            }

            function showPresentListeners(lecture) {
                var lectureId = lecture.id;
                dialogsService.showPresentListeners({
                    lectureId: lectureId,
                    presentListeners: (function () {
                        var activeLecture = findActiveLectureById(lectureId);
                        if (activeLecture) {
                            return activeLecture.presentListeners;
                        }
                        return [];
                    })()
                });
            }

            function getActiveLecture(lecture) {

                var intervalId = null;

                return {
                    lectureId: lecture.id,
                    lecture: lecture,
                    duration: 0,
                    presentListeners: [],
                    startTimer: function (task) {
                        task();
                        intervalId = $interval(task, 1000, 0, false);
                    },
                    stopTimer: function () {
                        if (intervalId) {
                            $interval.cancel(intervalId);
                            intervalId = null;
                        }
                    }
                }
            }

            $scope.loading = true;
            $scope.lectures = [];
            $scope.lectureModel = lectureModel;

            $scope.addedLecture = addedLecture;
            $scope.updatedLecture = updatedLecture;
            $scope.removedLecture = removedLecture;
            $scope.addLecture = addLecture;
            $scope.removeLecture = removeLecture;
            $scope.showItemEditor = showItemEditor;
            $scope.startLecture = startLecture;
            $scope.resumeLecture = resumeLecture;
            $scope.suspendLecture = suspendLecture;
            $scope.stopLecture = stopLecture;
            $scope.getLectureDuration = getLectureDuration;
            $scope.getPresentListenersCount = getPresentListenersCount;
            $scope.showPresentListeners = showPresentListeners;
            $scope.canManageLecture = canManageLecture;

            subscribeForSocketEvent();

            $scope.$on('home:workspaceChanged', function (event, workspaceId) {
                $scope.loading = true;
                apiService.getLecturesByWorkspaceId(workspaceId, function (lectures) {

                    $scope.lectures = lectures;

                    _.forEach(lectures, function (lecture) {
                        if (lecture.condition['status'] != 'stopped') {
                            var lectureId = lecture.id;
                            var activeLecture = getActiveLecture(lecture);
                            activeLectures.push(activeLecture);
                            activeLecture.startTimer(function () {
                                var socketConnection = $scope.socketConnection;
                                socketConnection.getLectureDuration(lectureId);
                            });
                        }
                    });

                    $scope.loading = false;
                });
            });
        }
    ]
);
