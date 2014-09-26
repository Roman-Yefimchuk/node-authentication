"use strict";

angular.module('application')

    .directive('staticController', [

        '$controller',
        '$http',
        '$templateCache',
        '$compile',

        function ($controller, $http, $templateCache, $compile) {

            function compileTemplate(scope, element, template) {
                var html = element.html(template);
                var contents = html.contents();
                $compile(contents)(scope);
            }

            function initController(scope, controller) {
                if (controller) {
                    $controller(controller, {
                        $scope: scope
                    });
                }
            }

            return {
                link: function (scope, element, attrs) {

                    var templateUrl = attrs['templateUrl'];
                    var controller = attrs['controller'];

                    if (templateUrl) {
                        var template = $templateCache.get(templateUrl);
                        if (template) {
                            initController(scope, controller);
                            compileTemplate(scope, element, template);
                        } else {
                            var request = $http.get(templateUrl);
                            request.success(function (template) {
                                $templateCache.put(templateUrl, template);

                                initController(scope, controller);
                                compileTemplate(scope, element, template);
                            });
                        }
                    } else {
                        initController(scope, controller);
                    }
                }
            };
        }
    ]
);