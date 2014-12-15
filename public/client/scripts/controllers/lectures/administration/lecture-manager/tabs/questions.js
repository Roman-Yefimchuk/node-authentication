"use strict";

angular.module('application')

    .controller('QuestionsController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$on('lectureManager:editorLoaded', function (event, model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addQuestion() {
                }

                $scope.addQuestion = addQuestion;
            });
        }
    ]
);
