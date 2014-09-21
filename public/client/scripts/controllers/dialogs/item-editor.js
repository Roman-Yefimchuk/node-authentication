"use strict";

angular.module('application')

    .controller('ItemEditorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var item = options.item;
            var onUpdate = options.onUpdate;

            $scope.originItemModel = item.title;
            $scope.itemModel = item.title;

            function save(itemModel) {
                var title = itemModel.trim();

                if (title.length && title != item.title) {
                    item.title = title;
                    onUpdate(item, function () {
                        $modalInstance.close();
                    });
                }
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.save = save;
            $scope.cancel = cancel;
        }
    ]
);
