"use strict";

angular.module('application')

    .directive('workspaceTree', [

        '$compile',
        '$log',
        '$rootScope',

        function ($compile, $log, $rootScope) {
            return {
                transclude: true,
                scope: {
                    treeModel: '=',
                    onSelection: '&',
                    onLoading: '&',
                    onToggle: '&'
                },
                link: function (scope, element, attr) {

                    var treeId = attr['treeId'];
                    if (!treeId) {
                        throw 'Tree ID not defined';
                    }

                    var Node = (function () {

                        function Node(nodeScope, item, element, parentNode, level) {
                            this.nodeScope = nodeScope;
                            this.item = item;
                            this.element = element;
                            this.parentNode = parentNode;
                            this.level = level;

                            this.expanded = false;
                            this.isLoaded = false;
                            this.childrenElement = element.find("[children]")
                        }

                        Node.prototype.onSelection = function ($event) {
                            if (scope.activeNode != this) {
                                if (scope.onSelection) {
                                    scope.onSelection({
                                        node: this
                                    });
                                }
                            }

                            scope.activeNode = this;
                            $event.stopPropagation();
                        };

                        Node.prototype.setActive = function () {
                            var node = this.parentNode;
                            while (node) {
                                node.expanded = true;
                                node = node.parentNode;
                            }

                            scope.activeNode = this;
                        };

                        Node.prototype.isActive = function () {
                            return scope.activeNode == this;
                        };

                        Node.prototype.isEmpty = function () {
                            var item = this.item;

                            return !(item.childrenCount || item.children['length']);
                        };

                        Node.prototype.toggle = function ($event) {
                            var context = this;

                            context.expanded = !context.expanded;

                            function toggle() {
                                if (scope.onToggle) {
                                    scope.onToggle({
                                        node: this,
                                        expanded: context.expanded
                                    });
                                }
                            }

                            if (context.expanded && !context.isLoaded) {
                                if (scope.onLoading) {
                                    scope.onLoading({
                                        item: context.item,
                                        callback: function (data, wrapItem) {
                                            context.isLoaded = true;

                                            _.forEach(data, function (item) {
                                                item = wrapItem(item);
                                                var node = context.insert(item);
                                                node.isLoaded = item.childrenCount == 0
                                            });

                                            toggle();
                                        }
                                    })
                                } else {
                                    context.isLoaded = true;
                                    toggle();
                                }
                            } else {
                                toggle();
                            }

                            $event.stopPropagation();
                        };

                        Node.prototype.insert = function (childItem) {
                            var context = this;

                            if (childItem) {

                                childItem.children = childItem.children || [];

                                var children = context.item['children'];
                                children.push(childItem);

                                var nodeScope = context.nodeScope;
                                var childrenElement = context.childrenElement;
                                var level = context.level;

                                return makeTreeNodes(nodeScope, [childItem], childrenElement, context, level + 1)[0];
                            }
                        };

                        Node.prototype.update = function (item) {
                            this.item = item;
                        };

                        Node.prototype.remove = function () {
                            var context = this;
                            var parentNode = context.parentNode;

                            if (parentNode) {
                                var children = parentNode.item['children'];

                                children = _.without(children, context.item);

                                parentNode.item['children'] = children;
                                parentNode.expanded = children.length > 0;

                                var activeNode = scope.activeNode;

                                if (activeNode == context) {
                                    scope.activeNode = parentNode;
                                } else {
                                    if (activeNode && context.level < activeNode.level) {
                                        scope.activeNode = parentNode;
                                    }
                                }
                            } else {
                                scope.activeNode = null;
                            }
                            var element = context.element;
                            element.remove();

                            var nodeScope = context.nodeScope;
                            nodeScope.$destroy();
                        };

                        return Node;

                    })();

                    scope.$on('workspaceTree[' + treeId + ']:search', function (event, id, callback) {
                        if (typeof callback == 'function') {
                            callback(global[id]);
                        } else {
                            $log.debug('callback is not function');
                        }
                    });

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

                            $rootScope.$broadcast('workspaceTree[' + treeId + ']:ready');
                        }
                    });

                    function getNode(nodeScope, item, element, parentNode, level) {

                        var node = new Node(nodeScope, item, element, parentNode, level);

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
                                '<div style="display: table;">' +
                                '     <span>' +
                                '         <a href="javascript:void(0)"><i ng-show="!node.isEmpty()" class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-minus-square-o\' : node.expanded, \'fa-plus-square-o\' : !node.expanded }"' +
                                '            ng-click="node.toggle($event)">' +
                                '         </i></a><i ng-show="node.isEmpty()" class="fa fa-minus-square-o" ' +
                                '            style="color: rgba(255, 255, 255, 0)">' +
                                '         </i>&nbsp;<i class="fa" style="cursor: pointer" ' +
                                '            ng-class="{ \'fa-folder-open\' : node.expanded, \'fa-folder\' : !node.expanded }">' +
                                '         </i>&nbsp;<a href="javascript:void(0)" style="cursor: pointer" ng-click="node.onSelection($event)"' +
                                '               ng-class="{ \'bold-fond\' : node.isActive() }" href>' +
                                '             {{ node.item["name"] }}' +
                                '         </a>' +
                                '     </span>' +
                                '     <div style="padding-left: 15px" children ng-show="node.expanded">' +
                                '     </div>' +
                                '</div>';

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

                            makeTreeNodes(nodeScope, children, treeNode.find("[children]"), nodeScope.node, level + 1);

                            element.append(treeNode);
                        });

                        return result;
                    }
                }
            };
        }
    ]
);