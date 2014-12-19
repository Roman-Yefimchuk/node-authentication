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

    module.exports = {
        sendFeedback: function (subject, senderAddress, message, callback) {
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
                    }, callback);
                },
                failure: function (error) {
                    callback(error);
                }
            });
        },
        verifyEmail: function (user, email, callback) {
            ResourcesManager.getResourceAsString('resources/email-verify-template.html', {
                success: function (template) {
                    transport.sendMail({
                        from: SUPPORT_EMAIL,
                        to: email,
                        subject: 'Email verification',
                        html: StringUtils.format(template, {
                            userName: user.displayName,
                            email: email,
                            supportEmail: SUPPORT_EMAIL,
                            token: (function () {
                                var verificationSession = EmailVerificationService.createSession(user.id, email);
                                return verificationSession.token;
                            })()
                        })
                    }, callback);
                },
                failure: function (error) {
                    callback(error);
                }
            });
        }
    };

})(require);