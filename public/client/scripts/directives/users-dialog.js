"use strict";

angular.module('application')

    .directive('usersDialog', [

        '$rootScope',
        'apiService',

        function ($rootScope, apiService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: '/client/views/users-list-view.html',
                scope: {},
                controller: function ($scope) {
                    $scope.show = false;
                    $scope.presentUsers = [];

                    $scope.$watch('show', function (value) {
                        if (!value) {
                            $scope.presentUsers = [];
                        }
                    });

                    $rootScope.$on('usersDialog:open', function (event, appScope) {
                        var presentUsers = appScope['presentUsers'];
                        if (presentUsers.length > 0) {
                            apiService.getUsers(presentUsers, function (users) {
                                $scope.presentUsers = users;
                                $scope.show = true;
                            });
                        } else {
                            $scope.show = true;
                        }
                    });

                    $scope.close = function () {
                        $scope.show = false;
                    };
                },
                link: function (scope, element, attrs) {
                    scope.dialogStyle = {};
                    if (attrs.width) {
                        scope.dialogStyle.width = attrs.width;
                    }
                    if (attrs.height) {
                        scope.dialogStyle.height = attrs.height;
                    }
                }
            };
        }
    ]
);