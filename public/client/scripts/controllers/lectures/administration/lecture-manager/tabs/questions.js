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
                }

                $scope.addQuestion = addQuestion;
            });
        }
    ]
);
