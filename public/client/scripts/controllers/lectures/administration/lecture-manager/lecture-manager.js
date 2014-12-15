"use strict";

angular.module('application')

    .controller('LectureManagerController', [

        '$scope',
        '$routeParams',
        '$location',
        'apiService',
        'userService',
        'loaderService',
        'dialogsService',
        'socketsService',
        'SOCKET_URL',

        function ($scope, $routeParams, $location, apiService, userService, loaderService, dialogsService) {

            var lectureId = $routeParams.lectureId;
            var tabs = [
                {
                    id: 'lecture',
                    title: 'Лекція',
                    icon: 'fa-bell',
                    templateUrl: '/public/client/views/controllers/lectures/administration/lecture-manager/tabs/lecture-tab-view.html',
                    isActive: true
                },
                {
                    id: 'questions',
                    title: 'Запитання',
                    icon: 'fa-question-circle',
                    templateUrl: '/public/client/views/controllers/lectures/administration/lecture-manager/tabs/questions-tab-view.html',
                    isActive: false
                },
                {
                    id: 'additional-links',
                    title: 'Додаткові посилання',
                    icon: 'fa-external-link-square',
                    templateUrl: '/public/client/views/controllers/lectures/administration/lecture-manager/tabs/additional-links-tab-view.html',
                    isActive: false
                },
                {
                    id: 'tags',
                    title: 'Теги',
                    icon: 'fa-tags',
                    templateUrl: '/public/client/views/controllers/lectures/administration/lecture-manager/tabs/tags-tab-view.html',
                    isActive: false
                }
            ];

            $scope.tabs = tabs;
            $scope.tab = _.find(tabs, function (tab) {
                return tab.isActive;
            });

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
                }
            }, function (result) {

                $scope.user = result.user;
                $scope.lecture = result.lecture;

                $scope.$broadcast('lectureManager:editorLoaded', {
                    user: result.user,
                    lecture: result.lecture
                });

                loaderService.hideLoader();

            }, function (error) {

                loaderService.hideLoader();

                dialogsService.showAlert({
                    title: 'Помилка',
                    message: 'Неможливо завантажити статистику',
                    onAccept: function (closeCallback) {
                        closeCallback();
                        $location.path('/home');
                    }
                });
            });
        }
    ]
);
