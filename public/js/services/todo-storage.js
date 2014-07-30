app.factory('todoStorage', ['$http', function ($http) {

    function sendRequest(params, callback) {
        var request = $http(params);
        if (!callback) {
            callback = function () {
            };
        }
        request.success(function (response) {
            if (response.status) {
                if (response.data) {
                    callback(response.data);
                } else {
                    callback({});
                }
                console.log(response.message);
            } else {
                alert(response.message);
            }
        });
        request.error(function (data) {
            alert(data);
        });
    }

    return {
        items: function (workspaceId, callback) {
            sendRequest({
                method: 'GET',
                url: '/api/items'
            }, callback);
        },
        save: function (todoModel, callback) {
            if (todoModel) {
                sendRequest({
                    method: 'POST',
                    url: '/api/save',
                    data: {
                        todoModel: todoModel
                    }
                }, function (data) {
                    callback(data.itemId);
                });
            } else {
                console.log('empty request');
            }
        },
        update: function (todoModels, callback) {
            if (todoModels && todoModels.length) {
                sendRequest({
                    method: 'POST',
                    url: '/api/update',
                    data: {
                        todoModels: todoModels
                    }
                }, callback);
            } else {
                console.log('empty request');
            }
        },
        remove: function (todoIds, callback) {
            if (todoIds && todoIds.length) {
                sendRequest({
                    method: 'POST',
                    url: '/api/remove',
                    data: {
                        todoIds: todoIds
                    }
                }, callback);
            } else {
                console.log('empty request');
            }
        }
    };
}]);