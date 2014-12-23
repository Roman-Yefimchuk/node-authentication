"use strict";

(function (require) {

    var _ = require('underscore');
    var NodeMailer = require("nodemailer");
    var SmtpTransport = require('nodemailer-smtp-transport');

    var secretQuestion = "Какой пароль?" +
        "i do not know";

    var SUPPORT_EMAIL = 'node.authentication@yandex.ru';
    var HOST = 'http://127.0.0.1:8080';

    var transporter = SmtpTransport({
        service: "Yandex",
        auth: {
            user: "node.authentication@yandex.ru",
            pass: "&ufs^$5hfd!@dsakDS^w212@$(%^#1bDG$#5528!!#^^t4hdbBJAS%$#nkje_+"
        }
    });
    var transport = NodeMailer.createTransport(transporter);
    var getTemplate = (function () {

        var ResourcesManager = require('../app/utils/resources-manager');
        var compiledCache = {};

        return function (templateName, handler) {
            if (compiledCache[templateName]) {
                handler.success(compiledCache[templateName]);
            } else {
                ResourcesManager.getResourceAsString(templateName, {
                    success: function (file) {
                        var template = _.template(file);
                        compiledCache[templateName] = template;
                        handler.success(template);
                    },
                    failure: function (error) {
                        handler.failure(error);
                    }
                });
            }
        };

    })();

    function send(templatePath, data, templateContext, handler) {
        getTemplate(templatePath, {
            success: function (template) {
                transport.sendMail({
                    from: SUPPORT_EMAIL,
                    to: data.recipient,
                    subject: data.subject,
                    html: template(templateContext)
                }, function (error, response) {
                    if (error) {
                        handler.failure(error);
                    } else {
                        handler.success(response);
                    }
                });
            },
            failure: function (error) {
                handler.failure(error);
            }
        });
    }

    function sendFeedback(subject, senderAddress, message, handler) {
        send('resources/templates/feedback-template.ejs', {
            recipient: 'romane@ikrok.net',
            subject: subject
        }, {
            senderAddress: senderAddress,
            message: message
        }, handler);
    }

    function sendEmailVerification(user, email, token, handler) {
        send('resources/templates/email-verification-template.ejs', {
            recipient: email,
            subject: 'Email verification'
        }, {
            userName: user.displayName,
            email: email,
            supportEmail: SUPPORT_EMAIL,
            host: HOST,
            token: token
        }, handler);
    }

    function sendTaskAssignment(userName, taskTitle, email, handler) {
        send('resources/templates/task-assignment-template.ejs', {
            recipient: email,
            subject: 'Task assignment'
        }, {
            userName: userName,
            taskTitle: taskTitle
        }, handler);
    }

    function sendStatusUpdate(userName, taskTitle, status, email, handler) {
        send('resources/templates/update-task-status-template.ejs', {
            recipient: email,
            subject: 'Task updated'
        }, {
            userName: userName,
            taskTitle: taskTitle,
            status: status
        }, handler);
    }

    function sendCloseTaskAssignment(userName, taskTitle, email, handler) {
        send('resources/templates/cancel-task-assignment-template.ejs', {
            recipient: email,
            subject: 'Closed task assignment'
        }, {
            userName: userName,
            taskTitle: taskTitle
        }, handler);
    }

    module.exports = {
        sendFeedback: sendFeedback,
        sendEmailVerification: sendEmailVerification,
        sendTaskAssignment: sendTaskAssignment,
        sendStatusUpdate: sendStatusUpdate,
        sendCloseTaskAssignment: sendCloseTaskAssignment
    };

})(require);