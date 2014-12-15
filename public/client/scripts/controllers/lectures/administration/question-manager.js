"use strict";

angular.module('application')

    .controller('QuestionManagerController', [

        '$scope',
        '$location',
        '$routeParams',
        '$timeout',
        'apiService',
        'dialogsService',
        'loaderService',
        'socketsService',
        'userService',
        'SOCKET_URL',

        function ($scope, $location, $routeParams, $timeout, apiService, dialogsService, loaderService, socketsService, userService, SOCKET_URL) {

            var lectureId = $routeParams.lectureId;

            function findQuestionById(questionId) {
                return _.findWhere($scope.questions, {
                    id: questionId
                });
            }

            function addQuestion() {

                var questions = $scope.questions;

                var questionTitle = $scope['newQuestion'].trim();
                if (questionTitle) {
                    apiService.createQuestion(lectureId, {
                        title: questionTitle,
                        type: 'default',
                        data: {
                            yes: 'Так',
                            no: 'Ні'
                        }
                    }, {
                        success: function (response) {
                            questions.push({
                                id: response.questionId,
                                title: questionTitle,
                                type: 'default',
                                data: {
                                    yes: 'Так',
                                    no: 'Ні'
                                }
                            });
                            $scope.newQuestion = '';
                        }
                    });
                }
            }

            function editQuestion(question) {
                dialogsService.showQuestionEditor({
                    editorTitle: 'Редагувати запитання',
                    questionModel: {
                        title: question.title,
                        type: question.type,
                        data: question.data
                    },
                    onSave: function (questionModel, closeCallback) {
                        apiService.updateQuestion(question.id, {
                            title: questionModel.title,
                            type: questionModel.type,
                            data: questionModel.data
                        }, {
                            success: function () {
                                question.title = questionModel.title;
                                question.type = questionModel.type;
                                question.data = questionModel.data;
                                closeCallback();
                            }
                        });
                    }
                });
            }

            function removeQuestion(question) {
                apiService.removeQuestion(question.id, {
                    success: function () {
                        $scope.questions = _.without($scope.questions, question);
                    }
                });
            }

            function clearInput() {
                $scope.newQuestion = '';
            }

            function askQuestion(question) {

                var socketConnection = $scope.socketConnection;
                socketConnection.askQuestion(lectureId, question);

                question.answers = [];
                question.isAsked = true;
            }

            function showAnsweredListeners(question) {
                dialogsService.showAnsweredListeners({
                    answers: question.answers
                });
            }

            function subscribeForSocketEvent() {

                $scope.$on('socketsService:updateQuestionInfo', function (event, data) {

                    var isAsked = data['isAsked'];
                    if (isAsked) {
                        var questionId = data['questionId'];
                        var answers = data['answers'];

                        var question = findQuestionById(questionId);
                        if (question) {
                            $timeout(function () {
                                question.isAsked = true;
                                question.answers = answers;
                            });
                        }
                    }
                });
            }

            $scope.newQuestion = '';
            $scope.questions = [];
            $scope.loading = false;
            $scope.showView = true;

            $scope.addQuestion = addQuestion;
            $scope.editQuestion = editQuestion;
            $scope.removeQuestion = removeQuestion;
            $scope.clearInput = clearInput;
            $scope.askQuestion = askQuestion;
            $scope.showAnsweredListeners = showAnsweredListeners;

            loaderService.showLoader();

            userService.getData({
                success: function (user) {

                    subscribeForSocketEvent();

                    socketsService.openCollection({
                        url: SOCKET_URL,
                        userId: user.userId
                    }, function (socketConnection) {

                        apiService.getLectureById(lectureId, {
                            success: function (response) {

                                $scope.lecture = response.lecture;

                                apiService.getQuestionsByLectureId(lectureId, {
                                    success: function (response) {
                                        $timeout(function () {

                                            $scope.socketConnection = socketConnection;
                                            $scope.questions = response.questions;
                                            $scope.user = user;

                                            _.forEach($scope.questions, function (question) {
                                                socketConnection.getQuestionInfo(lectureId, question.id);
                                            });

                                            loaderService.hideLoader();
                                        });
                                    },
                                    failure: function (error) {

                                        dialogsService.showAlert({
                                            title: 'Помилка',
                                            message: 'Список запитань не знайдено',
                                            onClose: function (closeCallback) {
                                                $location.path('/administration');
                                                closeCallback();
                                            }
                                        });

                                        $scope.showView = false;
                                        loaderService.hideLoader();
                                    }
                                });
                            },
                            failure: function (error) {

                                dialogsService.showAlert({
                                    title: 'Помилка',
                                    message: 'Лекція не знайдена',
                                    onClose: function (closeCallback) {
                                        $location.path('/administration');
                                        closeCallback();
                                    }
                                });

                                $scope.showView = false;
                                loaderService.hideLoader();
                            }
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
