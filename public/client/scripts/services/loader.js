'use strict';

angular.module('application')

    .service('loaderService', [

        function () {

            var body = angular.element(document['body']);
            var loader = angular.element('#ajax_loader');

            var originalOverflow = body.css('overflow');

            function isLoaderVisible() {
                return loader.is(":visible");
            }

            function showLoader() {
                body.css({
                    overflow: 'hidden'
                });
                loader.show();
            }

            function hideLoader() {
                body.css({
                    overflow: originalOverflow
                });
                loader.hide();
            }

            return {
                isLoaderVisible: isLoaderVisible,
                showLoader: showLoader,
                hideLoader: hideLoader
            };
        }
    ]
);