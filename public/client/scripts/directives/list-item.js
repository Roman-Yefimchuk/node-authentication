"use strict";

angular.module('application')

    .directive('listItem', [

        function () {
            return {
                templateUrl: '/client/views/directives/list-item-view.html',
                scope: {
                    user: '='
                },
                controller: function ($scope) {
                    $scope.$watch('user', function (user) {
                        $scope.permissions = user.permissions;
                    });
                }
            };
        }
    ]
);