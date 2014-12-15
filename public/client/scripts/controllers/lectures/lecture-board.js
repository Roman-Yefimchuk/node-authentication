"use strict";

angular.module('application')

    .controller('LectureBoardController', [

        '$scope',
        '$filter',
        '$location',
        '$routeParams',
        '$timeout',
        '$interval',
        'apiService',
        'dialogsService',
        'loaderService',
        'socketsService',
        'userService',
        'lectureActivityService',
        'SOCKET_URL',
        'ACTIVITY_COMMANDS',

        function ($scope, $filter, $location, $routeParams, $timeout, $interval, apiService, dialogsService, loaderService, socketsService, userService, lectureActivityService, SOCKET_URL, ACTIVITY_COMMANDS) {

            var lectureId = $routeParams.lectureId;
            var pieModel = [
                {
                    value: 0,
                    label: 'Зрозуміло',
                    color: "#449d44",
                    highlight: "#398439"
                },
                {
                    value: 100,
                    label: 'Незрозуміло',
                    color: "#c9302c",
                    highlight: "#ac2925"
                }
            ];
            var chartModel = getChartModel([]);
            var activityCollection = lectureActivityService.getActivityCollection();
            var tabs = [
                {
                    id: 'lecture-info',
                    title: 'Інформація',
                    icon: 'fa-info-circle',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-board/tabs/info-tab-view.html',
                    isActive: false
                },
                {
                    id: 'survey',
                    title: 'Опитування',
                    icon: 'fa-pie-chart',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-board/tabs/survey-tab-view.html',
                    isActive: true
                },
                {
                    id: 'activity',
                    title: 'Активність',
                    icon: 'fa-bolt',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-board/tabs/activity-tab-view.html',
                    isActive: false
                },
                {
                    id: 'questions',
                    title: 'Запитання лектора',
                    icon: 'fa-question-circle',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-board/tabs/teacher-questions-tab-view.html',
                    isActive: false
                }
            ];

            var lectureTimer = (function () {

                var intervalId = null;

                return {
                    start: function (task) {
                        task();
                        intervalId = $interval(task, 1000, 0, false);
                    },
                    stop: function () {
                        if (intervalId) {
                            $interval.cancel(intervalId);
                            intervalId = null;
                        }
                    }
                }
            })();

            function showPresentListeners() {
                dialogsService.showPresentListeners({
                    lectureId: lectureId,
                    presentListeners: $scope.presentListeners
                });
            }

            function resumeLecture() {
                var socketConnection = $scope.socketConnection;
                socketConnection.resumeLecture(lectureId);
            }

            function suspendLecture() {
                var socketConnection = $scope.socketConnection;
                socketConnection.suspendLecture(lectureId);
            }

            function stopLecture() {
                var socketConnection = $scope.socketConnection;
                socketConnection.stopLecture(lectureId);
            }

            function askQuestion(question) {

                var socketConnection = $scope.socketConnection;
                socketConnection.askQuestion(lectureId, question);

                question.answers = [];
                question.isAsked = true;

                activityCollection.push({
                    command: ACTIVITY_COMMANDS.QUESTION_ASKED,
                    question: question
                });
            }

            function showAnsweredListeners(question) {
                dialogsService.showAnsweredListeners({
                    answers: question.answers
                });
            }

            function setActiveTab(tab) {
                tab.isActive = true;
                $scope.tab = tab;
            }

            function getChartModel(chartPoints) {
                return {
                    labels: (function () {
                        var labels = (function () {
                            if (chartPoints.length > 0) {
                                return ["00:00"];
                            }
                            return ["00:00", "01:00"];
                        })();
                        _.forEach(chartPoints, function (chartPoint) {
                            labels.push($filter('formatTimestamp')(chartPoint.timestamp, '@{minutes}:@{seconds}'));
                        });
                        return labels;
                    })(),
                    datasets: [
                        {
                            fillColor: "rgba(220,220,220,0.2)",
                            strokeColor: "rgba(220,220,220,1)",
                            pointColor: "rgba(220,220,220,1)",
                            pointStrokeColor: "#fff",
                            pointHighlightFill: "#fff",
                            pointHighlightStroke: "rgba(220,220,220,1)",
                            data: (function () {
                                var data = (function () {
                                    if (chartPoints.length > 0) {
                                        return [0];
                                    }
                                    return [0, 0];
                                })();
                                _.forEach(chartPoints, function (chartPoint) {
                                    data.push(chartPoint.presentListeners);
                                });
                                return data;
                            })()
                        },
                        {
                            fillColor: "rgba(151,187,205,0.2)",
                            strokeColor: "rgba(151,187,205,1)",
                            pointColor: "rgba(151,187,205,1)",
                            pointStrokeColor: "#fff",
                            pointHighlightFill: "#fff",
                            pointHighlightStroke: "rgba(151,187,205,1)",
                            data: (function () {
                                var data = (function () {
                                    if (chartPoints.length > 0) {
                                        return [0];
                                    }
                                    return [0, 0];
                                })();
                                _.forEach(chartPoints, function (chartPoint) {
                                    data.push(((chartPoint.understandingPercentage * chartPoint.presentListeners) / 100).toFixed(2));
                                });
                                return data;
                            })()
                        }
                    ]
                };
            }

            function getUserName(userId, callback) {
                apiService.getUser(userId, function (response) {
                    var user = response.user;
                    var userName = user.name;
                    callback(userName);
                });
            }

            function subscribeForSocketEvent() {

                $scope.$on('socketsService:' + SocketCommands.USER_DISCONNECTED, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        var userId = data['userId'];
                        getUserName(userId, function (userName) {
                            $timeout(function () {
                                $scope.presentListeners = _.without($scope.presentListeners, userId);
                                activityCollection.push({
                                    command: ACTIVITY_COMMANDS.LISTENER_HAS_LEFT,
                                    userName: userName
                                });
                            });
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_RESUMED, function (event, data) {
                    if (lectureId == data['lectureId']) {

                        var lecture = $scope.lecture;
                        lecture.condition['status'] = 'started';

                        lectureTimer.start(function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.getLectureDuration(lectureId);
                        });

                        activityCollection.push({
                            command: ACTIVITY_COMMANDS.LECTURE_RESUMED
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_SUSPENDED, function (event, data) {
                    if (lectureId == data['lectureId']) {

                        var lecture = $scope.lecture;
                        lecture.condition['status'] = 'suspended';

                        lectureTimer.stop();

                        activityCollection.push({
                            command: ACTIVITY_COMMANDS.LECTURE_SUSPENDED
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STOPPED, function (event, data) {
                    if (lectureId == data['lectureId']) {

                        var lecture = $scope.lecture;
                        lecture.condition['status'] = 'stopped';

                        lectureTimer.stop();
                        $location.path('/home');
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_STATISTIC, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        var understandingValue = data['understandingValue'];

                        $timeout(function () {
                            pieModel[0].value = parseFloat(understandingValue).toFixed(1);
                            pieModel[1].value = (100 - parseFloat(understandingValue)).toFixed(1);
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.ON_MESSAGE, function (event, data) {

                    var userId = data['userId'];
                    var message = data['message'];

                    getUserName(userId, function (userName) {
                        $timeout(function () {
                            activityCollection.push({
                                command: ACTIVITY_COMMANDS.ON_MESSAGE,
                                userName: userName,
                                message: message
                            });
                        });
                    });
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_CHART, function (event, chartPoints) {
                    $scope.chartModel = getChartModel(chartPoints);
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_QUESTION_INFO, function (event, data) {

                    var isAsked = data['isAsked'];
                    if (isAsked) {

                        var questionId = data['questionId'];
                        var answers = data['answers'];

                        var question = _.findWhere($scope.questions, {
                            id: questionId
                        });

                        if (question) {
                            $timeout(function () {
                                question.isAsked = true;
                                question.answers = answers;
                            });
                        }
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_LECTURE_DURATION, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        $timeout(function () {
                            $scope.lectureDuration = data['duration'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_TOTAL_LECTURE_DURATION, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        $timeout(function () {
                            $scope.totalLectureDuration = data['totalDuration'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_PRESENT_LISTENERS, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        $timeout(function () {
                            $scope.presentListeners = data['presentListeners'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LISTENER_JOINED, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        var userId = data['userId'];
                        getUserName(userId, function (userName) {
                            $timeout(function () {
                                var presentListeners = $scope.presentListeners;
                                presentListeners.push(userId);
                                activityCollection.push({
                                    command: ACTIVITY_COMMANDS.LISTENER_JOINED,
                                    userName: userName
                                });
                            });
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LISTENER_HAS_LEFT, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        var userId = data['userId'];
                        getUserName(userId, function (userName) {
                            $timeout(function () {
                                $scope.presentListeners = _.without($scope.presentListeners, userId);
                                activityCollection.push({
                                    command: ACTIVITY_COMMANDS.LISTENER_HAS_LEFT,
                                    userName: userName
                                });
                            });
                        });
                    }
                });
            }

            $scope.lectureDuration = 0;
            $scope.totalLectureDuration = 0;
            $scope.presentListeners = [];
            $scope.activityCollection = activityCollection;
            $scope.questions = [];
            $scope.showView = true;
            $scope.loading = false;
            $scope.pieModel = pieModel;
            $scope.chartModel = chartModel;
            $scope.tabs = tabs;
            $scope.tab = _.find(tabs, function (tab) {
                return tab.isActive;
            });

            $scope.$on('$destroy', function () {
                lectureTimer.stop();
            });

            $scope.resumeLecture = resumeLecture;
            $scope.suspendLecture = suspendLecture;
            $scope.stopLecture = stopLecture;
            $scope.showPresentListeners = showPresentListeners;
            $scope.askQuestion = askQuestion;
            $scope.showAnsweredListeners = showAnsweredListeners;
            $scope.setActiveTab = setActiveTab;

            loaderService.showLoader();

            userService.getData({
                success: function (user) {

                    $scope.$on('socketsService:error', function (event, error) {
                        $scope.errorMessage = 'Проблема з сокетом';
                        loaderService.hideLoader();
                    });

                    socketsService.openConnection({
                        url: SOCKET_URL,
                        userId: user.userId
                    }, function (socketConnection) {

                        subscribeForSocketEvent();

                        AsyncUtils.parallel({
                            lecture: function (resolve, reject) {
                                apiService.getLectureById(lectureId, {
                                    success: function (lecture) {
                                        resolve(lecture);
                                    },
                                    failure: function (error) {
                                        reject(error);
                                    }
                                });
                            },
                            questions: function (resolve, reject) {
                                apiService.getQuestionsByLectureId(lectureId, {
                                    success: function (questions) {
                                        resolve(questions);
                                    },
                                    failure: function (error) {
                                        reject(error);
                                    }
                                });
                            }
                        }, function (result) {

                            var lecture = result.lecture;

                            $timeout(function () {

                                $scope.socketConnection = socketConnection;
                                $scope.lecture = result.lecture;
                                $scope.questions = result.questions;
                                $scope.user = user;

                                if (lecture.condition['status'] != 'stopped') {
                                    $scope.lectureDuration = 0;

                                    if (lecture.condition['status'] == 'started') {
                                        lectureTimer.start(function () {
                                            socketConnection.getLectureDuration(lectureId);
                                        });
                                        activityCollection.push({
                                            command: ACTIVITY_COMMANDS.LECTURE_STARTED
                                        });
                                    }

                                    socketConnection.updatePresentListeners(lectureId);
                                }

                                _.forEach($scope.questions, function (question) {
                                    socketConnection.getQuestionInfo(lectureId, question.id);
                                });

                                socketConnection.updateChart(lectureId);

                                loaderService.hideLoader();
                            });
                        }, function (error) {

                            dialogsService.showAlert({
                                title: 'Помилка',
                                message: 'Неможливо завантажити лекцію',
                                onAccept: function (closeCallback) {
                                    closeCallback();
                                    $location.path('/home');
                                }
                            });

                            $scope.showView = false;

                            loaderService.hideLoader();
                        });
                    })
                },
                failure: function (error) {
                    $location.path('/');
                    loaderService.hideLoader();
                }
            });
        }
    ]
);
