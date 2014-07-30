app.factory('workspaceProvider', ['$http', function ($http) {

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
        getAllWorkspaces: function (callback) {
            sendRequest({
                method: 'GET',
                url: '/api/get-all-workspaces'
            }, callback);
        },
        setUserWorkspace: function (workspaceId, callback) {
            sendRequest({
                method: 'GET',
                url: '/api/set-user-workspace/' + workspaceId
            }, callback);
        }
    };
}]);