"use strict";

angular.module('application')

    .controller('LectureController', [

        '$scope',
        '$location',
        'apiService',

        function ($scope, $location, apiService) {

            $scope.$emit('lectureManager:fetchManagerModel', function (model) {

                var lecture = model['lecture'];
                var user = model['user'];

                var originalLectureModel = {
                    title: lecture.title,
                    description: lecture.description
                };

                function saveLecture() {
                    apiService.updateLecture(lecture.id, {
                        title: $scope.lectureModel['title'],
                        description: $scope.lectureModel['description']
                    }, function () {
                        $location.path('/home');
                    });
                }

                function isSaveDisabled() {
                    return angular.equals(originalLectureModel, $scope.lectureModel);
                }

                $scope.lectureModel = angular.copy(originalLectureModel);

                $scope.saveLecture = saveLecture;
                $scope.isSaveDisabled = isSaveDisabled;
            });
        }
    ]
);
