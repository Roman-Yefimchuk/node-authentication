"use strict";

(function (require) {

    var SUPPORT_EMAIL = 'node.authentication@yandex.ru';

    var NodeMailer = require("nodemailer");
    var SmtpTransport = require('nodemailer-smtp-transport');

    var ResourcesManager = require('../app/utils/resources-manager');
    var StringUtils = require('../app/utils/string-utils');
    var EmailVerificationService = require('../app/email-verification-service');

    var transporter = SmtpTransport({
        service: "Yandex",
        auth: {
            user: "node.authentication@yandex.ru",
            pass: "&ufs^$5hfd!@dsakDS^w212@$(%^#1bDG$#5528!!#^^t4hdbBJAS%$#nkje_+"
        }
    });
    var transport = NodeMailer.createTransport(transporter);

    function sendFeedback(subject, senderAddress, message, handler) {
        ResourcesManager.getResourceAsString('resources/feedback-template.html', {
            success: function (template) {
                transport.sendMail({
                    from: SUPPORT_EMAIL,
                    to: 'romane@ikrok.net',
                    subject: subject,
                    html: StringUtils.format(template, {
                        senderAddress: senderAddress,
                        message: message
                    })
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

    function sendEmailVerification(user, email, token, handler) {
        ResourcesManager.getResourceAsString('resources/email-verification-template.html', {
            success: function (template) {
                transport.sendMail({
                    from: SUPPORT_EMAIL,
                    to: email,
                    subject: 'Email verification',
                    html: StringUtils.format(template, {
                        userName: user.displayName,
                        email: email,
                        supportEmail: SUPPORT_EMAIL,
                        token: token
                    })
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

    module.exports = {
        sendFeedback: sendFeedback,
        sendEmailVerification: sendEmailVerification
    };

})(require);