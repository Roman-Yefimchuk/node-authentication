module.exports = function (app, passport, dbProvider, developmentMode) {

    var getUserContext = require('./context-provider')['getUserContext'];

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/todo', function (req, res) {
        var userContext = getUserContext(req.user);
        if (userContext.isEmpty) {
            res.redirect('/');
        } else {

            var userId = userContext.userId;

            if (developmentMode) {
                console.log('render index page for user: ' + userId);
            }

            function renderHomePage(workspaceId, defaultWorkspaceId) {
                res.render('todo.ejs', {
                    userId: userId,
                    displayName: userContext.displayName,
                    provider: userContext.provider,
                    workspaceId: workspaceId,
                    defaultWorkspaceId: defaultWorkspaceId
                });
            }

            var workspaceId = req.flash('workspaceId');
            if (workspaceId && workspaceId.length > 0) {
                dbProvider.getDefaultWorkspace(userId, function (defaultWorkspaceId) {
                    renderHomePage(workspaceId, defaultWorkspaceId);
                });
            } else {
                dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
                    dbProvider.getDefaultWorkspace(userId, function (defaultWorkspaceId) {
                        renderHomePage(workspaceId, defaultWorkspaceId);
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