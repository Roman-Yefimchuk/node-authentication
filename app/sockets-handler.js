module.exports = function (io, developmentMode) {

    var socketsSession = {};

    io.on('connection', function (socket) {

        function notify(message, type) {
            if (!type) {
                type = 'info';
            }
            socket.emit('notification', {
                message: message,
                type: type
            });
        }

        console.log('user connected');

        socket.on('register_user', function (data) {

            var userId = data['userId'];

            socketsSession[socket.id] = {
                userId: userId
            };

            console.log('user[' + userId + '] registered');

            notify('User[' + userId + '] successfully registered', 'success');
        });

        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });
};