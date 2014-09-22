"use strict";

angular.module('application')

    .directive('staticInclude', [

        '$http',
        '$templateCache',
        '$compile',

        function ($http, $templateCache, $compile) {

            function compileTemplate(scope, element, template) {
                var html = element.html(template);
                var contents = html.contents();
                $compile(contents)(scope);
            }

            return {
                link: function (scope, element, attrs) {
                    var templatePath = attrs['staticInclude'];
                    var template = $templateCache.get(templatePath);

                    if (template) {
                        compileTemplate(scope, element, template);
                    } else {
                        var request = $http.get(templatePath);
                        request.success(function (template) {
                            $templateCache.put(templatePath, template);
                            compileTemplate(scope, element, template);
                        });
                    }
                }
            };
        }
    ]);