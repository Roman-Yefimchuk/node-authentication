app.controller('LoginController', ['$scope', 'apiProvider',
    function LoginController($scope, apiProvider) {

        $scope.workspaces = [];
        $scope.currentWorkspace = undefined;

        apiProvider.getAllWorkspaces(function (workspaces) {
            $scope.workspaces = workspaces;
            $scope.currentWorkspace = workspaces[0];
        });

        $scope.email = "";
        $scope.password = "";
    }
]);
