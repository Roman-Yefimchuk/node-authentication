app.controller('LoginController', ['$scope', 'workspaceProvider',
    function LoginController($scope, workspaceProvider) {

        $scope.workspaces = [];
        $scope.currentWorkspace = undefined;

        workspaceProvider.getAllWorkspaces(function (workspaces) {
            $scope.workspaces = workspaces;
            $scope.currentWorkspace = workspaces[0];
        });

        $scope.email = "";
        $scope.password = "";
    }
]);
