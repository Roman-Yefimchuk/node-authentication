app.controller('SingUpController', [ '$scope',
    function SingUpController($scope) {

        var emailPattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;

        $scope.email = "";
        $scope.password = "";
        $scope.isEmailValid = false;

        $scope.$watch('email', function (value) {
            $scope.isEmailValid = emailPattern.test(value);
        });

        $scope.quickSingUp = function () {
            $scope.email = 'roman@gmail.com';
            $scope.password = 'qwerty';

            $scope.$watch('email', function () {
                $('[action="/signup"]').submit();
            });
        }
    }
]);
