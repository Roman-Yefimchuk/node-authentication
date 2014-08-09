"use strict";

app.directive('listItem', function () {
    return {
        scope: {
            user: '='
        },
        controller: function ($scope) {
            $scope.$watch('user', function (user) {
                $scope.permissions = user.permissions;
            });
        },
        templateUrl: '/views/list-item-view.html'
    };
});