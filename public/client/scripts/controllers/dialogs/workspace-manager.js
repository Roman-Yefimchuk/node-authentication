"use strict";

angular.module('application')

    .controller('WorkspaceManagerController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {
            $scope.users = [];

            var originalCollection = [];

            var workspace = options.workspace;

            $scope.userId = options.userId;
            $scope.workspace = workspace;
            $scope.socketConnection = options.socketConnection;

            $scope.dialogTitle = workspace.name;
            $scope.workspaceId = workspace.id;

            apiService.getAllUsersWithPermissions(workspace.id, function (users) {
                $scope.users = users.filter(function (user) {
                    return user.id != $scope.userId;
                });

                originalCollection = angular.copy($scope.users);
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
