"use strict";

angular.module('application')

    .directive('workspaceTree', [

        '$compile',
        '$log',
        '$rootScope',
        '$http',

        function ($compile, $log, $rootScope, $http) {

            var NODE_TEMPLATE = null;

            function loadNodeTemplate(callback) {
                if (NODE_TEMPLATE) {
                    callback();
                } else {
                    var request = $http.get('/public/client/views/directives/workspace-tree/workspace-tree-node-view.html');
                    request.success(function (data) {
                        NODE_TEMPLATE = data;
                        callback();
                    });
                }
            }

            return {
                transclude: true,
                templateUrl: '/public/client/views/directives/workspace-tree/workspace-tree-view.html',
                scope: {
                    treeModel: '=',
                    onSelection: '&',
                    onLoading: '&',
                    onToggle: '&'
                },
                link: function (scope, element, attr) {

                    element = element.find('[tree-view]');

                    var treeId = attr['treeId'];
                    if (!treeId) {
                        throw 'Tree ID not defined';
                    }

                    var treeScope = null;

                    var rootNodes = {};
                    var nodes = {};
                    var gcCounter = 0;

                    var Node = (function () {

                        function triggerSelection(node) {
                            if (scope.activeNode && scope.onSelection) {
                                scope.onSelection({
                                    node: node
                                });
                            }
                        }

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

                        Node.prototype = {
                            isAvailable: function () {
                                var workspace = this.getWorkspace();
                                return workspace.isAvailable;
                            },
                            getLabel: function () {
                                var workspace = this.getWorkspace();
                                return workspace.name;
                            },
                            getWorkspace: function () {
                                return this.item['workspace'];
                            },
                            onSelection: function ($event) {
                                triggerSelection(this);

                                scope.activeNode = this;

                                if ($event) {
                                    $event.stopPropagation();
                                }
                            },
                            getRoot: function () {
                                var node = this;
                                while (node.parentNode) {
                                    node = node.parentNode;
                                }
                                return node;
                            },
                            getParent: function () {
                                return this.parentNode;
                            },
                            setActive: function () {
                                var node = this.parentNode;
                                while (node) {
                                    node.expanded = true;
                                    node = node.parentNode;
                                }

                                scope.activeNode = this;
                            },
                            isActive: function () {
                                return scope.activeNode == this;
                            },
                            isEmpty: function () {
                                var item = this.item;

                                return !((item.childrenCount && !this.isLoaded) || item.children['length']);
                            },
                            expand: function (callback) {
                                var context = this;
                                if (!context.expanded) {
                                    context.toggle(null, callback);
                                }
                            },
                            collapse: function () {
                                var context = this;
                                if (context.expanded) {
                                    context.toggle();
                                }
                            },
                            toggle: function ($event, callback) {
                                var context = this;

                                function toggle() {
                                    context.expanded = !context.expanded;
                                    if (scope.onToggle) {
                                        scope.onToggle({
                                            node: this,
                                            expanded: context.expanded
                                        });

                                        (callback || angular.noop)();
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

                                if ($event) {
                                    $event.stopPropagation();
                                }
                            },
                            childOf: function (parentNode) {
                                var node = this;
                                while (node) {
                                    if (node.parentNode == parentNode) {
                                        return true;
                                    }
                                    node = node.parentNode;
                                }
                                return false;
                            },
                            insert: function (childItem, callback) {
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
                            },
                            update: function (item) {
                                this.item = item;
                            },
                            remove: function () {
                                var context = this;
                                var parentNode = context.parentNode;

                                if (parentNode) {
                                    var children = parentNode.item['children'];

                                    children = _.without(children, context.item);

                                    parentNode.item['children'] = children;
                                    parentNode.expanded = children.length > 0;

                                    var activeNode = scope.activeNode;

                                    if (activeNode == context) {
                                        triggerSelection(parentNode);
                                        scope.activeNode = parentNode;
                                    } else {
                                        if (activeNode && context.level < activeNode.level) {
                                            triggerSelection(parentNode);
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
                            }
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
                            rootNodes = {};
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
                        for (var key in rootNodes) {
                            var rootNode = rootNodes[key];
                            if (rootNode && !rootNode.isEmpty()) {
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

                    scope.$on('workspaceTree[' + treeId + ']:insertRoot', function (event, item, callback) {
                        if (typeof callback == 'function') {
                            var node = makeTreeNodes(treeScope, [item], element)[0];
                            callback(node);
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

                        if (treeModel && treeModel.length) {

                            loadNodeTemplate(function () {

                                treeScope = getTreeScope();
                                makeTreeNodes(treeScope, treeModel, element);

                                $rootScope.$broadcast('workspaceTree[' + treeId + ']:ready');
                            });
                        }
                    });
                }
            };
        }
    ]
);