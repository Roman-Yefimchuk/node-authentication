"use strict";

angular.module('application')

    .directive('staticController', [

        '$controller',
        '$compile',

        function ($controller, $compile) {
            return {
                link: function (scope, element, attrs) {

                    var controller = attrs['staticController'];

                    if (controller) {

                        $controller(controller, {
                            $scope: scope
                        });

                        var contents = element.contents();

                        //TODO: not good
                        contents.off();

                        var compiledElement = $compile(contents)(scope);

                        element.replaceWith(compiledElement);
                    }
                }
            };
        }
    ]
);