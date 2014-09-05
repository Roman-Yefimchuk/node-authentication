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

                    var NODE_TEMPLATE = '' +
                        '<div style="display: table;">' +
                        '     <span>' +
                        '         <a href="javascript:void(0)"><i ng-show="!node.isEmpty()" class="fa" style="cursor: pointer;color: #000" ' +
                        '            ng-class="{ \'fa-minus-square-o\' : node.expanded, \'fa-plus-square-o\' : !node.expanded }"' +
                        '            ng-click="node.toggle($event)">' +
                        '         </i></a><i ng-show="node.isEmpty()" class="fa fa-minus-square-o" ' +
                        '            style="color: rgba(255, 255, 255, 0)">' +
                        '         </i>&nbsp;<i class="fa" style="cursor: pointer" ' +
                        '            ng-class="{ \'fa-folder-open\' : node.expanded, \'fa-folder\' : !node.expanded }">' +
                        '         </i>&nbsp;<a href="javascript:void(0)" style="cursor: pointer" ng-click="node.onSelection($event)"' +
                        '               ng-class="{ \'bold-fond\' : node.isActive() }" href>{{ node.item["name"] }}<span ng-show="node.isLoading">&nbsp;<i class="fa fa-refresh fa-spin" style="color: #000"></i></span>' +
                        '         </a>' +
                        '     </span>' +
                        '     <div style="padding-left: 15px" children ng-show="node.expanded">' +
                        '     </div>' +
                        '</div>';

                    var treeId = attr['treeId'];
                    if (!treeId) {
                        throw 'Tree ID not defined';
                    }

                    var treeScope = null;

                    var rootNodes = {};
                    var nodes = {};
                    var gcCounter = 0;

                    var Node = (function () {

                        function Node(nodeScope, item, element, parentNode, level) {
                            this.nodeScope = nodeScope;
                            this.item = item;
                            this.element = element;
                            this.parentNode = parentNode;
                            this.level = level;

                            this.expanded = false;
                            this.isLoaded = !item.childrenCount;
                            this.childrenElement = element.find("[children]");
                            this.isLoading = false;
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

                            function toggle() {
                                context.expanded = !context.expanded;
                                if (scope.onToggle) {
                                    scope.onToggle({
                                        node: this,
                                        expanded: context.expanded
                                    });
                                }
                            }

                            if (!context.expanded && !context.isLoaded) {
                                if (scope.onLoading) {
                                    context.isLoading = true;
                                    scope.onLoading({
                                        item: context.item,
                                        callback: function (data, wrapItem) {
                                            context.isLoaded = true;

                                            _.forEach(data, function (item) {
                                                item = wrapItem(item);
                                                context.insert(item);
                                            });

                                            context.isLoading = false;

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

                        Node.prototype.insert = function (childItem, callback) {
                            var context = this;

                            if (childItem) {

                                var insert = function () {
                                    childItem.children = childItem.children || [];

                                    var children = context.item['children'];
                                    children.push(childItem);

                                    var nodeScope = context.nodeScope;
                                    var childrenElement = context.childrenElement;
                                    var level = context.level;

                                    var childNode = makeTreeNodes(nodeScope, [childItem], childrenElement, context, level + 1)[0];

                                    (callback || angular.noop)(childNode);
                                };

                                if (context.isLoaded) {
                                    insert();
                                } else {
                                    if (scope.onLoading) {
                                        context.isLoading = true;
                                        scope.onLoading({
                                            item: context.item,
                                            callback: function (data, wrapItem) {
                                                context.isLoaded = true;

                                                _.forEach(data, function (item) {
                                                    item = wrapItem(item);
                                                    context.insert(item);
                                                });

                                                context.isLoading = false;

                                                var childNode = nodes[data[data.length - 1].id];
                                                (callback || angular.noop)(childNode)
                                            }
                                        })
                                    } else {
                                        context.isLoaded = true;
                                        insert();
                                    }
                                }
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

                    function compact(obj) {
                        var result = {};
                        _.forEach(obj, function (node) {
                            if (node) {
                                result[node.item['id']] = node;
                            }
                        });
                        return result;
                    }

                    function removeNode(id) {
                        nodes[id] = null;
                        if (rootNodes[id]) {
                            rootNodes[id] = null;
                        }
                        if (++gcCounter == 10) {

                            nodes = compact(nodes);
                            rootNodes = compact(rootNodes);

                            gcCounter = 0;

                            $log.debug('Compacted');
                            $log.debug(nodes);
                            $log.debug('----------------------');
                        }
                    }

                    function getTreeScope() {
                        var treeScope = scope.$new(scope);
                        treeScope.$on('$destroy', function (event) {
                            nodes = {};
                            $log.debug('WorkspaceTree destroyed');
                        });

                        return treeScope;
                    }

                    function getNode(nodeScope, item, element, parentNode, level) {

                        var node = new Node(nodeScope, item, element, parentNode, level);

                        if (nodes[item.id]) {
                            $log.debug('Duplicated ID: ' + item.id);
                            $log.debug('Item:');
                            $log.debug(item);
                            $log.debug('-----------------------------');
                        }

                        nodes[item.id] = node;

                        return node;
                    }

                    function makeTreeNodes(scope, data, element, parentNode, level) {

                        level = level || 0;

                        var result = [];

                        _.forEach(data, function (item) {

                            var children = item.children;

                            var treeNode = angular.element(NODE_TEMPLATE);

                            {
                                var nodeScope = scope.$new(scope);

                                var node = getNode(nodeScope, item, treeNode, parentNode, level);
                                nodeScope.node = node;

                                nodeScope.$on('$destroy', function (event) {
                                    removeNode(item.id);
                                    $log.debug(node.item['name'] + ' destroyed');
                                });

                                if (level == 0) {
                                    rootNodes[item.id] = node;
                                }
                            }

                            $compile(treeNode)(nodeScope);

                            result.push(nodeScope.node);

                            makeTreeNodes(nodeScope, children, treeNode.find("[children]"), nodeScope.node, level + 1);

                            element.append(treeNode);
                        });

                        return result;
                    }

                    scope.needShift = function () {
                        for (var index = 0; index < rootNodes.length; index++) {
                            var rootNode = rootNodes[index];
                            if (rootNode.childrenCount || rootNode.children['length']) {
                                return true;
                            }
                        }
                        return false;
                    };

                    scope.$on('workspaceTree[' + treeId + ']:search', function (event, id, callback) {
                        if (typeof callback == 'function') {
                            callback(nodes[id]);
                        } else {
                            $log.debug('callback is not function');
                        }
                    });

                    scope.activeNode = null;

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
                }
            };
        }
    ]
);