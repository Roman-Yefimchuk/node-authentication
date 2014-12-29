"use strict";

angular.module('application').

    directive('oauthFrame', [

        function () {
            return {
                replace: true,
                templateUrl: '/public/client/views/directives/oauth-frame-view.html',
                scope: {},
                controller: function ($scope) {

                    $scope.show = false;
                    $scope.title = "OAuth frame";

                },
                link: function (scope, element, attrs) {
                    scope.frameStyle = {};
                    if (attrs.width) {
                        scope.frameStyle.width = attrs.width;
                    }
                    if (attrs.height) {
                        scope.frameStyle.height = attrs.height;
                    }
                }
            };
        }]);