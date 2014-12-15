"use strict";

angular.module('application')

    .controller('LectureHallController', [

        '$scope',
        '$rootScope',
        '$location',
        '$routeParams',
        '$timeout',
        '$interval',
        'apiService',
        'loaderService',
        'socketsService',
        'userService',
        'dialogsService',
        'lectureActivityService',
        'SOCKET_URL',
        'ACTIVITY_COMMANDS',

        function ($scope, $rootScope, $location, $routeParams, $timeout, $interval, apiService, loaderService, socketsService, userService, dialogsService, lectureActivityService, SOCKET_URL, ACTIVITY_COMMANDS) {

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
            var teacherQuestions = [];
            var activityCollection = lectureActivityService.getActivityCollection();
            var message = {
                text: ''
            };
            var answerForms = {
                'default': '/public/client/views/controllers/lecture-room/tabs/answer-forms/default/' +
                    'substrate-view.html',
                'single-choice': '/client/views/controllers/lecture-room/tabs/answer-forms/multi-choice/' +
                    'substrate-view.html',
                'multi-choice': '/client/views/controllers/lecture-room/tabs/answer-forms/single-choice/' +
                    'substrate-view.html',
                'range': '/client/views/controllers/lecture-room/tabs/answer-forms/range/' +
                    'substrate-view.html'
            };
            var tabs = [
                {
                    id: 'lecture-info',
                    title: 'Інформація',
                    icon: 'fa-info-circle',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-hall/tabs/info-tab-view.html',
                    isActive: false
                },
                {
                    id: 'survey',
                    title: 'Опитування',
                    icon: 'fa-pie-chart',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-hall/tabs/survey-tab-view.html',
                    isActive: true
                },
                {
                    id: 'activity',
                    title: 'Активність',
                    icon: 'fa-bolt',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-hall/tabs/activity-tab-view.html',
                    isActive: false
                },
                {
                    id: 'questions',
                    title: 'Запитання лектора',
                    icon: 'fa-question-circle',
                    templateUrl: '/public/client/views/controllers/lectures/lecture-hall/tabs/teacher-questions-tab-view.html',
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

            function setActiveTab(tab) {
                tab.isActive = true;
                $scope.tab = tab;
            }

            function getUserName(userId, callback) {
                apiService.getUser(userId, {
                    success: function (response) {
                        var user = response.user;
                        var userName = user.name;
                        callback(userName);
                    }
                });
            }

            function subscribeForSocketEvent() {

                $scope.$on('socketsService:' + SocketCommands.USER_DISCONNECTED, function (event, data) {
                    if (data['lectureId'] == lectureId) {
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

                        $rootScope.$broadcast('suspendDialog:close');

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

                        $timeout(function () {
                            activityCollection.push({
                                command: ACTIVITY_COMMANDS.LECTURE_SUSPENDED
                            });
                        });

                        dialogsService.showSuspendedDialog({
                            leaveCallback: function (closeCallback) {
                                quit();
                                closeCallback();
                            }
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STOPPED, function (event, data) {
                    if (lectureId == data['lectureId']) {

                        var lecture = $scope.lecture;
                        lecture.condition['status'] = 'stopped';

                        lectureTimer.stop();

                        $rootScope.$broadcast('suspendDialog:close');

                        dialogsService.showAlert({
                            title: 'Лекція закінчена',
                            message: '' +
                                'Лекція на тему "<b>' + lecture.title + '</b>" закінчена.' +
                                '<br>' +
                                'Дякуємо за увагу.',
                            onAccept: function (closeCallback) {
                                closeCallback();
                                $location.path('/home');
                            }
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_LECTURE_DURATION, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        $timeout(function () {
                            $scope.lectureDuration = data['duration'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.QUESTION_ASKED, function (event, data) {
                    if (lectureId == data['lectureId']) {

                        var question = data['question'];

                        teacherQuestions.push({
                            id: question.id,
                            title: question.title,
                            type: question.type,
                            data: question.data,
                            answer: undefined
                        });

                        $timeout(function () {
                            activityCollection.push('Викладач задав питання: ' + question.title);
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

                $scope.$on('socketsService:' + SocketCommands.UPDATE_STATISTIC, function (event, data) {
                    if (lectureId == data['lectureId']) {
                        var understandingValue = data['understandingValue'];

                        $timeout(function () {
                            pieModel[0].value = parseFloat(understandingValue).toFixed(1);
                            pieModel[1].value = (100 - parseFloat(understandingValue)).toFixed(1);
                        });
                    }
                });
            }

            function updateStatistic(value) {
                var socketConnection = $scope.socketConnection;
                socketConnection.updateStatistic(lectureId, value);
            }

            function sendMessage() {
                var message = $scope.message;
                var socketConnection = $scope.socketConnection;
                socketConnection.sendMessage(lectureId, message.text);

                activityCollection.push({
                    command: ACTIVITY_COMMANDS.SEND_MESSAGE,
                    message: message
                });

                message.text = '';
            }

            function replyForTeacherQuestion(question, answer) {
                var socketConnection = $scope.socketConnection;
                var questionId = question.id;
                question.answer = answer;
                socketConnection.replyForTeacherQuestion(lectureId, questionId, answer);
            }

            function showPresentListeners() {
                dialogsService.showPresentListeners({
                    lectureId: lectureId,
                    presentListeners: $scope.presentListeners
                });
            }

            function quit() {
                dialogsService.showConfirmation({
                    title: "Вихід",
                    message: "Ви дійсно хочете покинути лекцію?",
                    onAccept: function (closeCallback) {
                        closeCallback();
                        $location.path('/home');
                    }
                });
            }

            $scope.$on('$destroy', function () {

                var socketConnection = $scope.socketConnection;
                socketConnection.leftFromLecture(lectureId);

                lectureTimer.stop();

                $rootScope.$broadcast('suspendDialog:close');
            });

            $scope.lectureDuration = 0;
            $scope.totalLectureDuration = 0;
            $scope.presentListeners = [];
            $scope.answerForms = answerForms;
            $scope.activityCollection = activityCollection;
            $scope.message = message;
            $scope.teacherQuestions = teacherQuestions;
            $scope.showView = true;
            $scope.pieModel = pieModel;
            $scope.pieOptions = {
                segmentShowStroke: true,
                segmentStrokeColor: "#fff",
                segmentStrokeWidth: 1,
                animateRotate: false
            };
            $scope.tabs = tabs;
            $scope.tab = _.find(tabs, function (tab) {
                return tab.isActive;
            });

            $scope.setActiveTab = setActiveTab;
            $scope.showPresentListeners = showPresentListeners;
            $scope.quit = quit;
            $scope.replyForTeacherQuestion = replyForTeacherQuestion;
            $scope.sendMessage = sendMessage;
            $scope.updateStatistic = updateStatistic;

            loaderService.showLoader();

            userService.getData({
                success: function (user) {

                    apiService.getLectureById(lectureId, {
                        success: function (lecture) {

                            if (lecture.condition['status'] == 'stopped') {
                                dialogsService.showAlert({
                                    title: 'Лекція закінчена',
                                    message: 'Лекція на тему "<b>' + lecture.title + '"</b> закінчена',
                                    onAccept: function (closeCallback) {
                                        closeCallback();
                                        $location.path('/home');
                                    }
                                });
                            } else {

                                $scope.$on('socketsService:error', function (event, error) {
                                    $scope.errorMessage = 'Проблема з сокетом';
                                    loaderService.hideLoader();
                                });

                                socketsService.openConnection({
                                    url: SOCKET_URL,
                                    userId: user.userId
                                }, function (socketConnection) {

                                    subscribeForSocketEvent();

                                    socketConnection.joinToLecture(lectureId);

                                    $timeout(function () {

                                        $scope.lectureDuration = 0;
                                        $scope.socketConnection = socketConnection;
                                        $scope.lecture = lecture;
                                        $scope.user = user;

                                        socketConnection.getLectureDuration(lectureId);
                                        socketConnection.updatePresentListeners(lectureId);

                                        switch (lecture.condition['status']) {
                                            case 'suspended':
                                            {
                                                dialogsService.showSuspendedDialog({
                                                    leaveCallback: function (closeCallback) {
                                                        quit();
                                                        closeCallback();
                                                    }
                                                });
                                                break;
                                            }
                                            case 'started':
                                            {
                                                lectureTimer.start(function () {
                                                    socketConnection.getLectureDuration(lectureId);
                                                });
                                                break;
                                            }
                                        }

                                        activityCollection.push({
                                            command: ACTIVITY_COMMANDS.LISTENER_JOINED,
                                            userName: $scope.user['displayName']
                                        });

                                        $scope.showView = true;
                                        loaderService.hideLoader();
                                    });
                                });
                            }
                        },
                        failure: function (error) {

                            dialogsService.showAlert({
                                title: 'Помилка',
                                message: 'Лекція не знайдена',
                                onAccept: function (closeCallback) {
                                    closeCallback();
                                    $location.path('/home');
                                }
                            });

                            $scope.showView = false;
                            loaderService.hideLoader();
                        }
                    });
                },
                failure: function (error) {
                    $location.path('/');
                    loaderService.hideLoader();
                }
            });
        }
    ]
);
