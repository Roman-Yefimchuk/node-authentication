app.directive('usersDialog', ['$rootScope', 'apiProvider', function ($rootScope, apiProvider) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/views/users-list-view.html',
        scope: {},
        controller: function ($scope) {
            $scope.show = false;
            $scope.users = [];

            $rootScope.$on('openUsersDialog', function (event, appScope) {
                $scope.show = true;
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
}]);