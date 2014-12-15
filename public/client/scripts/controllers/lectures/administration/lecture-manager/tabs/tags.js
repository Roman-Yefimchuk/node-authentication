"use strict";

angular.module('application')

    .controller('TagsController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$on('lectureManager:editorLoaded', function (event, model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addTag() {
                }

                $scope.addTag = addTag;
            });
        }
    ]
);
