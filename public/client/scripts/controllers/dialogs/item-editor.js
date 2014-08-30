"use strict";

angular.module('application')

    .controller('ItemEditorController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            var item = options.item;
            var editCallback = options.editCallback;

            $scope.originItemModel = item.title;
            $scope.itemModel = item.title;

            $scope.save = function (itemModel) {
                var title = itemModel.trim();

                if (title.length && title != item.title) {
                    item.title = title;
                    editCallback(item, function () {
                        $modalInstance.close();
                    });
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
    ]
);
