'use strict';
const nodemailer = require('nodemailer');

module.exports.sendEmail = function(sender, recipient, subject, message, options) {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: options.service,
            auth: {
                user: options.user,
                pass: options.password
            }
        });
        let messageOptions = {
            from: sender,
            to: recipient,
            subject: subject,
            html: message
        };
        transporter.sendMail(messageOptions, (err, info) => {

            if (err) {
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
}