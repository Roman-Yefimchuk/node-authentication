"use strict";

angular.module('application')

    .controller('WorkspaceManagerController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            $scope.pagination = {
                itemsPerPage: 5,
                maxPaginationSize: 5,
                totalPages: 0,
                pageNumber: 1
            };

            $scope.itemsPerPage = 5;
            $scope.maxPaginationSize = 5;

            $scope.users = [];

            var originalCollection = [];

            var workspace = options.workspace;

            $scope.userId = options.userId;
            $scope.workspace = workspace;
            $scope.socketConnection = options.socketConnection;

            $scope.dialogTitle = workspace.name;
            $scope.workspaceId = workspace.id;

            function updatePage() {
                apiService.getAllUsersWithPermissions(workspace.id, {
                    skip: ($scope.pagination['pageNumber'] - 1) * $scope.pagination['itemsPerPage'],
                    limit: $scope.pagination['itemsPerPage']
                }, function (result) {
                    $scope.pagination['totalPages'] = result.count;
                    if (result.count > 0) {

/*                        $scope.users = _.filter(result.users, function (user) {
                            return user.id != $scope.userId;
                        });*/

                        $scope.users = result.users;

                        originalCollection = angular.copy($scope.users);
                    }
                });
            }

            $scope.$watch('pagination.pageNumber', function () {
                updatePage();
            });

            $scope.save = function () {
                var collection = [];

                _.forEach($scope.users, function (user, index) {
                    if (!angular.equals(user.permissions, originalCollection[index].permissions)) {
                        collection.push({
                            userId: user.id,
                            permissions: user.permissions
                        });
                    }
                });

                if (collection.length > 0) {
                    apiService.setUsersPermissionsForWorkspace($scope.workspaceId, collection, function () {
                        var socketConnection = $scope.socketConnection;
                        socketConnection.permissionsChanged(collection, $scope.workspaceId);

                        $modalInstance.close();
                    });
                } else {
                    $modalInstance.close();
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
    ]
);
