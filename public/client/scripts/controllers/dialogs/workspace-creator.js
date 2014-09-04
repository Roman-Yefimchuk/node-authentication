"use strict";

angular.module('application')

    .controller('WorkspaceCreatorController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            var workspaceId = options.workspaceId;
            var createCallback = options.createCallback;

            $scope.workspaceName = 'New workspace';
            $scope.workspaceId = workspaceId;
            $scope.switchWorkspace = false;

            $scope.createWorkspace = function (workspaceName, workspaceId, switchWorkspace) {
                var workspaceName = workspaceName.trim();

                if (workspaceName) {
                    apiService.createWorkspace(workspaceName, workspaceId, function (data) {
                        var workspace = data.workspace;
                        createCallback(workspace, switchWorkspace, function () {
                            $modalInstance.close();
                        });
                    });
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
    ]
);
