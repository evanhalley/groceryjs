'use strict';
const winston = require('winston');

let transports = [
    new winston.transports.Console({
        name: 'console',
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    }),
    new winston.transports.File({
        name: 'normal',
        level: 'debug',
        filename: 'log/grocerbot.log',
        handleExceptions: true,
        json: false,
        colorize: false
    })
];

const logger = new winston.Logger({
    transports: transports,
    exitOnError: false
});

module.exports = logger;