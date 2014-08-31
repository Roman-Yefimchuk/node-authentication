"use strict";

angular.module('application')

    .controller('WorkspaceCreatorController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            var createCallback = options.createCallback;

            $scope.workspaceName = 'New workspace';
            $scope.switchWorkspace = false;

            $scope.createWorkspace = function (workspaceName, switchWorkspace) {
                var workspaceName = workspaceName.trim();

                if (workspaceName) {
                    apiService.createWorkspace(workspaceName, function (data) {
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
