"use strict";

angular.module('application')

    .controller('ItemEditorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var onUpdate = options.onUpdate;

            var readableItemModel = options.item;
            var editableItemModel = {
                title: readableItemModel.title,
                priority: readableItemModel.priority
            };

            var itemPriorityDropdown = {
                isOpen: false
            };

            function canSaveItem() {
                return readableItemModel.title != editableItemModel.title ||
                    readableItemModel.priority != editableItemModel.priority;
            }

            function setFocus() {
                var input = angular.element('#editor-input');
                input.focus();
            }

            function setItemPriority(priority) {
                editableItemModel.priority = priority;
                itemPriorityDropdown.isOpen = false;
                setFocus();
            }

            function save() {

                if (canSaveItem()) {
                    var title = editableItemModel['title'].trim();

                    if (title.length > 0) {

                        readableItemModel.title = editableItemModel.title;
                        readableItemModel.priority = editableItemModel.priority;

                        onUpdate(readableItemModel, function () {
                            $modalInstance.close();
                        });
                    }
                }
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.itemModel = editableItemModel;
            $scope.itemPriorityDropdown = itemPriorityDropdown;

            $scope.canSaveItem = canSaveItem;
            $scope.setItemPriority = setItemPriority;
            $scope.save = save;
            $scope.cancel = cancel;
        }
    ]
);
