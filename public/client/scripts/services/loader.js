'use strict';

angular.module('application')

    .service('loaderService', [

        function () {

            var body = angular.element(document['body']);
            var loader = angular.element('#ajax_loader');

            var originalOverflow = body.css('overflow');

            return {
                isLoaderVisible: function () {
                    return loader.is(":visible");
                },
                showLoader: function () {
                    body.css({
                        overflow: 'hidden'
                    });
                    loader.show();
                },
                hideLoader: function () {
                    body.css({
                        overflow: originalOverflow
                    });
                    loader.hide();
                }
            };
        }
    ]
);