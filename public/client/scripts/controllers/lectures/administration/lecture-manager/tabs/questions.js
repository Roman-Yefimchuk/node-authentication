"use strict";

angular.module('application')

    .controller('QuestionsController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$emit('lectureManager:fetchManagerModel', function (model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addQuestion() {
                    dialogsService.showQuestionEditor({
                        editorTitle: 'Додати запитання',
                        mode: 'create',
                        model: {
                            title: '',
                            type: 'default',
                            data: {
                                yes: 'Так',
                                no: 'Ні'
                            }
                        },
                        onSave: function (model, closeCallback) {
                            apiService.createQuestion(lecture.id, {
                                title: model.title,
                                type: model.type,
                                data: model.data
                            }, function (response) {

                                var questions = $scope.questions;
                                questions.push({
                                    id: response.questionId,
                                    title: model.title,
                                    lectureId: lecture.id,
                                    creationDate: response.creationDate,
                                    type: model.type,
                                    data: model.data
                                });

                                closeCallback();
                            });
                        }
                    });
                }

                function editQuestion(question) {
                    dialogsService.showQuestionEditor({
                        editorTitle: 'Редагувати запитання',
                        mode: 'update',
                        model: {
                            title: question.title,
                            type: question.type,
                            data: question.data
                        },
                        onSave: function (model, closeCallback) {
                            apiService.updateQuestion(question.id, {
                                title: model.title,
                                type: model.type,
                                data: model.data
                            }, function () {
                                question.title = model.title;
                                question.type = model.type;
                                question.data = model.data;
                                closeCallback();
                            });
                        }
                    });
                }

                function removeQuestion(question) {
                    apiService.removeQuestion(question.id, function () {
                        $scope.questions = _.without($scope.questions, question);
                    });
                }

                $scope.questionModel = "";
                $scope.questions = [];

                $scope.addQuestion = addQuestion;
                $scope.editQuestion = editQuestion;
                $scope.removeQuestion = removeQuestion;

                apiService.getQuestionsByLectureId(lecture.id, {
                    success: function (questions) {
                        $scope.questions = questions;
                    },
                    failure: function () {
                        dialogsService.showAlert({
                            title: 'Помилка',
                            message: 'Неможливо завантажити запитання',
                            onClose: function (closeCallback) {
                                closeCallback();
                            }
                        });
                    }
                });

            });
        }
    ]
);
