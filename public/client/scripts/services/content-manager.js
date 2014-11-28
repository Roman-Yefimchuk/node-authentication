'use strict';

angular.module('application')

    .service('contentManagerService', [

        function () {

            function image(relativePath) {
                return 'public/client/images/' + relativePath;
            }

            function view(relativePath) {
                return 'public/client/views/' + relativePath;
            }

            return {
                image: image,
                view: view
            };
        }
    ]
);