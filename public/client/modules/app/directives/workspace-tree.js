"use strict";

var randomString = ((function () {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

    return function (length) {
        if (!length) {
            length = 16;
        }

        var result = '';
        for (var index = 0; index < length; index++) {
            var charIndex = Math.floor(Math.random() * chars.length);
            result += chars[charIndex];
        }
        return result;
    }
})());

tree.directive("workspaceTree", [

    '$compile',

    function ($compile) {
        return {
            restrict: "A",
            controller: function ($scope) {
                $scope.model = [
                    {
                        id: randomString(),
                        name: randomString(),
                        type: 'file',
                        childrenQuantity: 10,
                        children: []
                    }
                ];

                $scope.onItemClick = function (item) {
                };

                $scope.insertChildNode = function (item) {
                    item.insertChildNode({
                        id: randomString(),
                        name: randomString(),
                        childrenQuantity: 10,
                        type: 'directory',
                        children: []
                    });
                    $scope.updateTree();
                };

                $scope.removeNode = function (item) {
                    item.removeNode();
                    $scope.updateTree();
                };
            },
            link: function (scope, element) {

                scope.items = {};

                var makeStructure = function () {

                    var makeStructure = function (treeModel, hierarchyLevel, parent, savedVisibleInstance) {

                        savedVisibleInstance = savedVisibleInstance || {};

                        _.forEach(treeModel, function (node, index) {

                            var id = node.id;
                            var children = node.children;

                            function getNode(node, hierarchyLevel, parent, remove) {

                                var id = node.id;

                                var children = node.children;
                                if (children && children.length > 0) {
                                    _.forEach(children, function (childNode, index) {

                                        children[index] = getNode(childNode, hierarchyLevel + 1, node, function () {
                                            scope.items[childNode.id] = null;
                                            children[index] = null;

                                            updateRemoveCounter();
                                        });

                                        scope.items[childNode.id] = children[index];
                                    });
                                }

                                return {
                                    id: id,
                                    name: node.name,
                                    type: node.type,
                                    childrenQuantity: node.childrenQuantity,
                                    hierarchyLevel: hierarchyLevel,
                                    parent: parent,
                                    children: node.children,
                                    isOpen: savedVisibleInstance[id] || false,
                                    toggle: function () {
                                        this.isOpen = !this.isOpen;
                                    },
                                    insertChildNode: function (childNode) {
                                        var children = node.children;
                                        var index = children.length;

                                        children.push(getNode(childNode, hierarchyLevel + 1, node, function () {
                                            scope.items[childNode.id] = null;
                                            children[index] = null;

                                            updateRemoveCounter();
                                        }));

                                        scope.items[childNode.id] = children[index];
                                    },
                                    updateNode: function (id, data) {
                                    },
                                    removeNode: function () {
                                        remove();
                                    }
                                };
                            }

                            scope.items[id] = getNode(node, hierarchyLevel, parent, function () {
                                scope.items[id] = null;
                                treeModel[index] = null;

                                updateRemoveCounter();
                            });

                            makeStructure(children, hierarchyLevel + 1, node, savedVisibleInstance);
                        });
                    };

                    var removedCounter = 0;

                    function updateRemoveCounter() {
                        if (++removedCounter == 5) {

                            var compactModel = function (model) {
                                var result = _.compact(model);

                                _.forEach(result, function (modelItem, index) {
                                    var children = modelItem.children;

                                    if (children && children.length > 0) {
                                        modelItem.children = compactModel(children);
                                    }
                                });

                                return result;
                            };


                            scope.model = compactModel(scope.model);

                            if (scope.model.length > 0) {

                                var savedVisibleInstance = {};

                                _.forEach(scope.items, function (item, id) {
                                    if (item) {
                                        savedVisibleInstance[id] = item.isOpen;
                                    }
                                });

                                scope.items = {};
                                makeStructure(scope.model, 0, null, savedVisibleInstance);
                            }

                            removedCounter = 0;
                        }
                    }

                    return makeStructure;
                }();

                function updateTree(data, element, lines) {

                    function getLength(obj) {
                        var internalLength = 0;
                        _.forEach(obj, function (value) {
                            if (value) {
                                internalLength++;
                            }
                        });
                        return internalLength;
                    }


                    var length = getLength(data);
                    var index = 0;

                    _.forEach(data, function (item) {
                        if (item) {

                            var id = item.id;
                            var name = item.name;
                            var children = item.children;
                            var childMark = '';

                            var textTemplate = '' +
                                '<span class="tree_item" ' +
                                '      ng-click="onItemClick(items[\'{id}\'])" ' +
                                '      ng-class="{tree_selected_item : isItemSelected(items[\'{id}\'])}">' +
                                '      {{ items[\'{id}\'].name }}' +
                                '</span>';

                            var text = textTemplate.format({
                                id: id
                            });

                            if (getLength(children) != 0) {
                                if (length != 0) {
                                    var template = '' +
                                        '<div ng-class="{{minus} : items[\'{id}\'].isOpen, {plus} : !items[\'{id}\'].isOpen}" ' +
                                        '     ng-click="items[\'{id}\'].toggle()">' +
                                        '</div>' +
                                        '<div ng-show="type" class="tree_icon_{type}">' +
                                        '</div>' +
                                        '{text}';

                                    if (length == 1) {
                                        if (item.parent) {
                                            childMark = template.format({
                                                'minus': 'tree_minus_3',
                                                'id': id,
                                                'plus': 'tree_plus_3',
                                                'text': text,
                                                'type': item.type
                                            });
                                        } else {
                                            childMark = template.format({
                                                'minus': 'tree_minus_0',
                                                'id': id,
                                                'plus': 'tree_plus_0',
                                                'text': text,
                                                'type': item.type
                                            });
                                        }
                                    } else {
                                        if (index == 0) {
                                            if (item.parent) {
                                                childMark = template.format({
                                                    'plus': 'tree_plus_2',
                                                    'minus': 'tree_minus_2',
                                                    'id': id,
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            } else {
                                                childMark = template.format({
                                                    'plus': 'tree_plus_1',
                                                    'minus': 'tree_minus_1',
                                                    'id': id,
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            }
                                        } else {
                                            if (index != length - 1) {
                                                childMark = template.format({
                                                    'plus': 'tree_plus_2',
                                                    'minus': 'tree_minus_2',
                                                    'id': id,
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            } else {
                                                childMark = template.format({
                                                    'plus': 'tree_plus_3',
                                                    'minus': 'tree_minus_3',
                                                    'id': id,
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            }
                                        }
                                    }
                                }
                            } else {
                                if (length != 0) {
                                    var template = '' +
                                        '<div class="{class}">' +
                                        '</div>' +
                                        '<div ng-show="type" class="tree_icon_{type}">' +
                                        '</div>' +
                                        '{text}';

                                    if (length == 1) {
                                        childMark = template.format({
                                            'class': 'tree_line_2',
                                            'text': text,
                                            'type': item.type
                                        });
                                    } else {
                                        if (index == 0) {
                                            childMark = template.format({
                                                'class': 'tree_line_3',
                                                'text': text,
                                                'type': item.type
                                            });
                                        } else {
                                            if (index != length - 1) {
                                                childMark = template.format({
                                                    'class': 'tree_line_3',
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            } else {
                                                childMark = template.format({
                                                    'class': 'tree_line_2',
                                                    'text': text,
                                                    'type': item.type
                                                });
                                            }
                                        }
                                    }
                                }
                            }

                            var tmpl = '';

                            _.forEach(lines, function (hasLine) {
                                if (hasLine) {
                                    tmpl += '<div class="tree_line_1"></div>'
                                } else {
                                    tmpl += '<div class="tree_space"></div>'
                                }
                            });

                            childMark = tmpl + childMark;

                            var template = ('' +
                                '<div>' +
                                '     <div class="tree_node">{childMark}' +
                                '         <input type="button" value="+" ng-click="insertChildNode(items[\'{id}\'])">' +
                                '         <input type="button" value="x" ng-click="removeNode(items[\'{id}\'])">' +
                                '     </div>' +
                                '     <div child ng-show="items[\'{id}\'].isOpen">' +
                                '     </div>' +
                                '</div>' +
                                '').format({
                                    'id': id,
                                    'childMark': childMark
                                });

                            var treeNode = angular.element(template);
                            $compile(treeNode)(scope);

                            updateTree(children, treeNode.find("[child]"), lines.concat(index != length - 1));

                            element.append(treeNode);

                            index++;
                        }
                    });
                }

                scope.buildTreeStructure = function () {
                    var model = scope.model;
                    if (model.length > 0) {
                        element.empty();
                        makeStructure(model, 0);

                        updateTree(model, element, []);
                    }
                };

                scope.updateTree = function () {
                    element.empty();

                    var model = scope.model;
                    if (model.length > 0) {
                        updateTree(model, element, []);
                    }
                };

                scope.buildTreeStructure();
            }
        };
    }
]);