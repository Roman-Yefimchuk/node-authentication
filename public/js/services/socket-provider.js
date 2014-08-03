app.factory('socketProvider', function () {
    return {
        openCollection: function (url, $scope) {
            var socket = io.connect(url);

            socket.emit('register_user', {
                userId: $scope.userId
            });

            socket.on('notification', function (data) {
                $.notify(data['message'], {
                    position: "right bottom",
                    className: data['type'],
                    autoHideDelay: 2500
                });
            });
        }
    };
});