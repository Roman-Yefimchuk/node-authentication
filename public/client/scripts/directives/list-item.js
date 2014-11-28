"use strict";

angular.module('application')

    .directive('listItem', [

        function () {
            return {
                templateUrl: '/public/client/views/directives/list-item-view.html',
                scope: {
                    user: '='
                },
                controller: ['$scope', function ($scope) {
                    $scope.$watch('user', function (user) {
                        $scope.permissions = user.permissions;
                    });
                }]
            };
        }
    ]
);