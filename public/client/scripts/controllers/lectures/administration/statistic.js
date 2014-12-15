"use strict";

angular.module('application')

    .controller('StatisticController', [

        '$scope',
        '$routeParams',
        'loaderService',
        'apiService',
        'dialogsService',
        'userService',

        function ($scope, $routeParams, loaderService, apiService, dialogsService, userService) {

            var lectureId = $routeParams.lectureId;

            $scope.loading = true;
            $scope.statisticCollection = [];

            loaderService.showLoader();

            AsyncUtils.parallel({
                user: function (resolve, reject) {
                    userService.getData({
                        success: function (user) {
                            resolve(user);
                        },
                        failure: function (error) {
                            reject(error);
                        }
                    });
                },
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
                lectureStatistic: function (resolve, reject) {
                    apiService.getLectureStatisticById(lectureId, {
                        success: function (response) {
                            resolve(response);
                        },
                        failure: function (error) {
                            reject(error);
                        }
                    });
                }
            }, function (result) {

                $scope.user = result.user;
                $scope.lecture = result.lecture;
                $scope.statisticCollection = _.filter(result.lectureStatistic, function (lectureStatistic) {
                    return lectureStatistic.chartPoints['length'] > 0;
                });

                $scope.loading = false;
                loaderService.hideLoader();

            }, function (error) {

                $scope.loading = false;
                loaderService.hideLoader();

                dialogsService.showAlert({
                    title: 'Помилка',
                    message: 'Неможливо завантажити статистику'
                });
            });
        }
    ]
);
