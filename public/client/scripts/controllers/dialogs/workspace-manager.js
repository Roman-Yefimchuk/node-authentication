"use strict";

angular.module('application')

    .controller('WorkspaceManagerController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            var originalCollection = [];
            var workspace = options.workspace;

            var pagination = {
                itemsPerPage: 5,
                maxPaginationSize: 5,
                totalItems: 0,
                pageNumber: 1
            };

            function updatePage() {
                apiService.getAllUsersWithPermissions(workspace.id, {
                    skip: (pagination.pageNumber - 1) * pagination.itemsPerPage,
                    limit: pagination.itemsPerPage
                }, function (result) {
                    pagination.totalItems = result.count;

                    if (result.count > 0) {
                        $scope.users = result.users;
                        originalCollection = angular.copy($scope.users);
                    }
                });
            }

            $scope.pagination = pagination;

            $scope.users = [];

            $scope.userId = options.userId;
            $scope.workspace = workspace;
            $scope.socketConnection = options.socketConnection;

            $scope.dialogTitle = workspace.name;
            $scope.workspaceId = workspace.id;

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
