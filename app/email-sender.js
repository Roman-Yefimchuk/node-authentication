"use strict";

(function (require) {

    var NodeMailer = require("nodemailer");
    var SmtpTransport = require('nodemailer-smtp-transport');

    var ResourcesManager = require('../app/utils/resources-manager');
    var StringUtils = require('../app/utils/string-utils');

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
                success: function (feedbackTemplate) {
                    transport.sendMail({
                        from: 'node.authentication@yandex.ru',
                        to: 'romane@ikrok.net',
                        subject: subject,
                        html: StringUtils.format(feedbackTemplate, {
                            senderAddress: senderAddress,
                            message: message
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