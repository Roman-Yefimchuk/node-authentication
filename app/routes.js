module.exports = function (app, passport, dbProvider) {

    var getUserContext = require('./context-provider')['getUserContext'];

    function getWorkspaceId(request) {
        var params = request.params;
        return params.workspaceId;
    }

    function getUserId(request) {
        var params = request.params;
        return params.userId;
    }

    app.get('/api/get-permitted-workspaces', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            dbProvider.getPermittedWorkspaces(userId, function (workspaces) {
                res.send({
                    status: true,
                    message: 'Selected ' + workspaces.length + ' permitted workspaces(s)',
                    data: workspaces
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/api/get-all-users', function (req, res) {
        dbProvider.getAllUsers(function (users) {
            res.send({
                status: true,
                message: 'Selected ' + users.length + ' users(s)',
                data: users
            });
        });
    });

    app.get('/api/get-all-workspaces', function (req, res) {
        dbProvider.getAllWorkspaces(function (workspaces) {
            res.send({
                status: true,
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    app.get('/api/get-workspaces/:userId', function (req, res) {
        var userId = getUserId(req);
        dbProvider.getWorkspaces(userId, function (workspaces) {
            res.send({
                status: true,
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    app.get('/api/get-user-workspace', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
                res.send({
                    status: true,
                    message: 'Current user workspace ID: ' + workspaceId,
                    data: {
                        workspaceId: workspaceId
                    }
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/api/set-user-workspace/:workspaceId', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var workspaceId = getWorkspaceId(req);
            dbProvider.setUserWorkspaceId(userId, workspaceId, function () {
                res.send({
                    status: true,
                    message: 'New workspace ID: ' + workspaceId
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/api/add-workspace', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var name = req.body['name'];
        } else {
            res.redirect('/');
        }
    });

    app.get('/api/items/:workspaceId', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var workspaceId = getWorkspaceId(req);
            dbProvider.getItems(workspaceId, userId, function (items) {
                res.send({
                    status: true,
                    message: 'Selected ' + items.length + ' item(s)',
                    data: items
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/api/save/:workspaceId', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var workspaceId = getWorkspaceId(req);
            var todoModel = req.body['todoModel'];
            dbProvider.save(workspaceId, userId, todoModel, function (itemId) {
                res.send({
                    status: true,
                    message: 'Item[' + itemId + '] saved',
                    data: {
                        itemId: itemId
                    }
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/api/update/:workspaceId', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var workspaceId = getWorkspaceId(req);
            var todoModels = req.body['todoModels'];
            dbProvider.update(workspaceId, userId, todoModels, function () {
                res.send({
                    status: true,
                    message: '(' + todoModels.length + ') item(s) updated'
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/api/remove/:workspaceId', function (req, res) {
        var userId = getUserContext(req.user)['userId'];
        if (userId) {
            var workspaceId = getWorkspaceId(req);
            var todoIds = req.body['todoIds'];
            dbProvider.remove(workspaceId, userId, todoIds, function () {
                res.send({
                    status: true,
                    message: 'Removed ' + todoIds.length + ' item(s)'
                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/todo', function (req, res) {
        var userContext = getUserContext(req.user);
        if (userContext.isEmpty) {
            res.redirect('/');
        } else {

            var userId = userContext.userId;

            var workspaceId = req.flash('workspaceId');
            if (workspaceId && workspaceId.length > 0) {
                res.render('todo.ejs', {
                    userId: userId,
                    displayName: userContext.displayName,
                    provider: userContext.provider,
                    workspaceId: workspaceId
                });
            } else {
                dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
                    res.render('todo.ejs', {
                        userId: userId,
                        displayName: userContext.displayName,
                        provider: userContext.provider,
                        workspaceId: workspaceId
                    });
                });
            }
        }
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // locally --------------------------------

    // LOGIN ===============================
    // show the login form
    app.get('/login', function (req, res) {
        res.render('login.ejs', {
            message: req.flash('loginMessage')
        });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/todo',
        failureRedirect: '/login',
        failureFlash: true
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('sign-up.ejs', {
            message: req.flash('loginMessage')
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/todo',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: 'email'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', {
        scope: 'email'
    }));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/todo', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', {
        scope: 'email'
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', {
        scope: 'email'
    }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback', passport.authorize('google', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function (req, res) {
        var user = req.user;
        user.twitter.token = undefined;
        user.save(function (err) {
            res.redirect('/');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect('/');
        });
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}