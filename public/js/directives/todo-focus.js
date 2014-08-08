"use strict";

app.directive('todoFocus', ['$timeout', function ($timeout) {
    return function (scope, elem, attrs) {
        scope.$watch(attrs.todoFocus, function (newValue) {
            if (newValue) {
                $timeout(function () {
                    elem[0].focus();
                }, 0, false);
            }
        });
    };
}]);