"use strict";

app.directive('externalNotification', [

    'notificationProvider',

    function (notificationProvider) {
        return {
            restrict: 'E',
            scope: {
                type: '@',
                message: '@'
            },
            controller: function ($scope) {
                $scope.$watch('message', function (message) {
                    notificationProvider.notify(message, $scope.type);
                    $scope.destroyNotification();
                });
            },
            link: function (scope, element) {
                scope.destroyNotification = function () {
                    element.remove();
                };
            }
        };
    }
]);