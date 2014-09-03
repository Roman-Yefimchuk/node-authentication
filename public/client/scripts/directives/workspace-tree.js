"use strict";

angular.module('application')

    .directive('workspaceTree', [

        '$compile',
        '$log',

        function ($compile, $log) {
            return {
                transclude: true,
                scope: {
                    treeModel: '=',
                    onSelection: '&'
                },
                controller: function ($scope) {
                },
                link: function (scope, element, attr) {

                    scope.activeNode = null;

                    var global = {};
                    var gcCounter = 0;

                    function removeFromGlobal(id) {
                        global[id] = null;
                        if (++gcCounter == 10) {

                            var result = {};
                            _.forEach(global, function (node) {
                                if (node) {
                                    result[node.item['id']] = node;
                                }
                            });

                            global = result;
                            gcCounter = 0;

                            $log.debug('Compacted');
                            $log.debug(global);
                            $log.debug('----------------------');
                        }
                    }

                    function getTreeScope() {
                        var treeScope = scope.$new(scope);
                        treeScope.$on('$destroy', function (event) {
                            global = {};
                            $log.debug('WorkspaceTree destroyed');
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

                    function getNode(nodeScope, item, treeNode, parentNode, level) {
                        var childTreeNode = treeNode.find("[child]");

                        var node = {
                            item: item,
                            open: false,
                            level: level,
                            parentNode: parentNode,
                            onSelection: function ($event) {

                                if (scope.activeNode != this) {
                                    if (scope.onSelection) {
                                        scope.onSelection({
                                            node: this
                                        });
                                    }
                                }

                                scope.activeNode = this;
                                $event.stopPropagation();
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
                            toggle: function ($event) {
                                this.open = !this.open;
                                $event.stopPropagation();
                            },
                            insert: function (data) {
                                if (data) {
                                    var childItem = {
                                        id: data.id,
                                        name: data.name,
                                        children: data.children || []
                                    };

                                    var children = item.children;
                                    children.push(childItem);

                                    return makeTreeNodes(nodeScope, [childItem], childTreeNode, node, level + 1)[0];
                                }
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
                                        if (activeNode && node.level < activeNode.level) {
                                            scope.activeNode = parentNode;
                                        }
                                    }
                                } else {
                                    scope.activeNode = null;
                                }
                                treeNode.remove();
                                nodeScope.$destroy();
                            }
                        };

                        if (global[item.id]) {
                            $log.debug('Duplicated ID: ' + item.id);
                            $log.debug('Item:');
                            $log.debug(item);
                            $log.debug('-----------------------------');
                        }

                        global[item.id] = node;

                        return node;
                    }

                    function makeTreeNodes(scope, data, element, parentNode, level) {

                        level = level || 0;

                        var result = [];

                        _.forEach(data, function (item) {

                            var children = item.children;

                            var template = '' +
                                '<li style="display: table;">' +
                                '     <span>' +
                                '         <i ng-show="!node.isEmpty()" class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-minus-square-o\' : node.open, \'fa-plus-square-o\' : !node.open }"' +
                                '            ng-click="node.toggle($event)">' +
                                '         </i><i ng-show="node.isEmpty()" class="fa fa-minus-square-o" ' +
                                '            style="color: rgba(255, 255, 255, 0)">' +
                                '         </i>&nbsp;<i class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-folder-open\' : node.open, \'fa-folder\' : !node.open }">' +
                                '         </i>' +
                                '         <a style="cursor: pointer" ng-click="node.onSelection($event)" class="active"' +
                                '               ng-class="{ \'bold-fond\' : node.isActive() }" href>' +
                                '             {{ node.item["name"] }}' +
                                '         </a>&nbsp;<i class="fa fa-times" style="cursor: pointer"  ng-click="node.remove()"></i>' +
                                '     </span>' +
                                '     <ul style="padding-left: 15px" child ng-show="node.open">' +
                                '     </ul>' +
                                '</li>';

                            var treeNode = angular.element(template);

                            {
                                var nodeScope = scope.$new(scope);

                                nodeScope.$on('$destroy', function (event) {
                                    removeFromGlobal(item.id);
                                    $log.debug(nodeScope.node.item.name + ' destroyed');
                                });

                                nodeScope.node = getNode(nodeScope, item, treeNode, parentNode, level);
                            }

                            $compile(treeNode)(nodeScope);

                            result.push(nodeScope.node);

                            makeTreeNodes(nodeScope, children, treeNode.find("[child]"), nodeScope.node, level + 1);

                            element.append(treeNode);
                        });

                        return result;
                    }
                }
            };
        }
    ]
);