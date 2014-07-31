app.directive('managerDialog', ['$rootScope', 'apiProvider', function ($rootScope, apiProvider) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/views/workspace-manager-view.html',
        controller: function ($scope) {
            $scope.show = false;
            $scope.users = [];

            var originalCollection = [];

            $scope.$watch('show', function (value) {
                if (!value) {
                    $scope.users = [];
                    originalCollection = [];
                }
            });

            $rootScope.$on('openWorkspaceManager', function (event, appScope) {
                var userId = appScope['userId'];
                $scope.dialogTitle = appScope['currentWorkspace'].name;
                apiProvider.getAllUsers(function (users) {
                    $scope.users = users.filter(function (user) {
                        return user.id != userId;
                    });

                    {
                        $scope.users.forEach(function (user) {
                            user.permissions = {
                                readOnly: true,
                                collectionManager: false,
                                accessManager: true
                            };
                        });
                    }

                    originalCollection = angular.copy($scope.users);

                    $scope.show = true;
                });
            });

            $scope.save = function () {
                $scope.show = false;
            }

            $scope.cancel = function () {
                $scope.show = false;
            }
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