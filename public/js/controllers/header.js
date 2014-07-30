app.controller('HeaderController', ['$scope',
    function HeaderController($scope) {
        $scope.logout = function () {
            window.location = 'logout';
        };
    }
]);
