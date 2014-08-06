app.directive('managerDialog', ['$rootScope', 'apiProvider', function ($rootScope, apiProvider) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/views/workspace-manager-view.html',
        scope: {},
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
                var workspace = appScope['currentWorkspace'];

                $scope.appScope = appScope;
                $scope.dialogTitle = workspace.name;
                $scope.workspaceId = workspace.id;

                apiProvider.getAllUsersWithPermissions(workspace.id, function (users) {
                    $scope.users = users.filter(function (user) {
                        return user.id != userId;
                    });

                    originalCollection = angular.copy($scope.users);

                    $scope.show = true;
                });
            });

            $scope.save = function () {
                var collection = [];
                var users = $scope.users;

                for (var index = 0; index < users.length; index++) {
                    var user = users[index];
                    if (!angular.equals(user.permissions, originalCollection[index].permissions)) {
                        collection.push({
                            userId: user.id,
                            permissions: user.permissions
                        });
                    }
                }

                if (collection.length > 0) {
                    apiProvider.setUsersPermissionsForWorkspace($scope.workspaceId, collection, function () {
                        var socketConnection = $scope.appScope['socketConnection'];
                        socketConnection.permissionsChanged(collection);

                        $scope.show = false;
                    });
                } else {
                    $scope.show = false;
                }
            };

            $scope.cancel = function () {
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