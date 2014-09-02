"use strict";

angular.module('application')

    .directive('workspaceTree', [

        '$compile',

        function ($compile) {
            return {
                scope: {
                    treeModel: '=',
                    onItemSelect: '&',
                    onItemRemove: '&'
                },
                controller: function ($scope) {
                    $scope.$on('treeView:select', function (event, node) {
                        if ($scope.onItemSelect) {
                            $scope.onItemSelect()(node['item']);
                        }
                    });
                    $scope.$on('treeView:remove', function (event, node) {
                        if ($scope.onItemRemove) {
                            $scope.onItemRemove()(node['item']);
                        }
                    });
                },
                link: function (scope, element, attrs) {

                    scope.activeNode = null;

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

                    function getTreeScope() {
                        var treeScope = scope.$new(scope);
                        treeScope.$on('$destroy', function (event) {
                            console.log('tree view destroyed');
                        });

                        return treeScope;
                    }

                    var treeScope = null;

                    scope.$watch('treeModel', function (treeModel) {
                        element.empty();

                        if (treeScope) {
                            treeScope.$destroy();
                        }

                        if (treeModel) {
                            treeScope = getTreeScope();
                            makeTreeNodes(treeScope, treeModel, element);
                        }
                    });

                    function getNode(nodeScope, item, treeNode, parentNode) {
                        var childTreeNode = treeNode.find("[child]");

                        var node = {
                            item: item,
                            open: false,
                            parentNode: parentNode,
                            onClick: function () {
                                scope.activeNode = this;
                                treeScope.$emit('treeView:select', this);
                            },
                            setActive: function () {
                                scope.activeNode = this;
                            },
                            isActive: function () {
                                return scope.activeNode == this;
                            },
                            isEmpty: function () {
                                return !this.item['children'].length;
                            },
                            toggle: function () {
                                this.open = !this.open;
                            },
                            insert: function (data) {

                                if (!data) {
                                    data = {
                                        id: randomString(),
                                        name: randomString(),
                                        childrenQuantity: 10,
                                        children: []
                                    };
                                }

                                var childItem = {
                                    id: data.id,
                                    name: data.name,
                                    childrenQuantity: data.childrenQuantity,
                                    level: item.level + 1,
                                    children: data.children || []
                                };

                                var children = item.children;
                                children.push(childItem);

                                return makeTreeNodes(nodeScope, [childItem], childTreeNode, node)[0];
                            },
                            update: function (name) {
                                this.item['name'] = name;
                            },
                            remove: function () {
                                if (parentNode) {
                                    var children = parentNode.item['children'];

                                    children = _.without(children, item);

                                    parentNode.item['children'] = children;
                                    parentNode.open = children.length > 0;

                                    var activeNode = scope.activeNode;

                                    if (activeNode == node) {
                                        scope.activeNode = parentNode;
                                    } else {
                                        if (activeNode && node.item['level'] < activeNode.item['level']) {
                                            scope.activeNode = parentNode;
                                        }
                                    }
                                } else {
                                    scope.activeNode = null;
                                }

                                treeScope.$emit('treeView:remove', this);

                                treeNode.remove();
                                nodeScope.$destroy();
                            }
                        };

                        return node;
                    }

                    function makeTreeNodes(scope, data, element, parentNode) {

                        var result = [];

                        _.forEach(data, function (item) {

                            var children = item.children;

                            var template = ('' +
                                '<li style="display: table;">' +
                                '     <span>' +
                                '         <i ng-show="!node.isEmpty()" class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-minus-square-o\' : node.open, \'fa-plus-square-o\' : !node.open }"' +
                                '            ng-click="node.toggle()">' +
                                '         </i><i ng-show="node.isEmpty()" class="fa fa-minus-square-o" ' +
                                '            style="color: rgba(255, 255, 255, 0)">' +
                                '         </i>&nbsp;<i class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-folder-open\' : node.open, \'fa-folder\' : !node.open }">' +
                                '         </i>' +
                                '         <a style="cursor: pointer" ng-click="node.onClick()" class="active"' +
                                '               ng-class="{ \'bold-fond\' : node.isActive() }" href>' +
                                '             {{ node.item["name"] }}' +
                                '         </a>&nbsp;<i class="fa fa-plus" style="cursor: pointer" ng-click="node.insert()"></i>&nbsp;<i class="fa fa-times" style="cursor: pointer"  ng-click="node.remove()"></i>' +
                                '     </span>' +
                                '     <ul style="padding-left: 15px" child ng-show="node.open">' +
                                '     </ul>' +
                                '</li>' +
                                '');

                            var treeNode = angular.element(template);

                            {
                                var nodeScope = scope.$new(scope);

                                nodeScope.$on('$destroy', function (event) {
                                    console.log(nodeScope.node.item.name + ' destroyed');
                                });

                                nodeScope.node = getNode(nodeScope, item, treeNode, parentNode);
                            }

                            $compile(treeNode)(nodeScope);

                            result.push(nodeScope.node);

                            makeTreeNodes(nodeScope, children, treeNode.find("[child]"), nodeScope.node);

                            element.append(treeNode);
                        });

                        return result;
                    }
                }
            };
        }
    ]
);