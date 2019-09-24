'use strict';
const moment = require('moment');
const logger = require('./logger');
const LowesShopper = require('./bot/lowes-shopper').bot;
const SheetGrocerySource = require('./source/sheets-grocery-source').SheetsGrocerySource;
const mailUtil = require('./util/mail-util');
const credential = require('./config/google-api-key.json');
const config = require('./config/config');

(async () => {
    logger.info('Beginning shopping trip..');
    let shopper = null;

    try {
        let sheetSource = new SheetGrocerySource(logger, credential.client_email, credential.private_key, config.source.sheetId);
        await sheetSource.init();
        let list = await sheetSource.getGroceryList();

        // login and create a blank slate to shop
        shopper = new LowesShopper(logger);
        await shopper.init(config.shopper.headless);
        await shopper.login(config.shopper.email, config.shopper.password);
        await shopper.emptyCart();

        // do the shoppping
        let shoppingResults = [];
        for (let i = 0; i < list.length; i++) {
            let requestedItem = list[i];
            let shoppedItem = await shopper.addItemToCart(requestedItem.name, requestedItem.quantity);
            shoppingResults.push({ requested: requestedItem.name, result: shoppedItem });
        }
        logger.debug(JSON.stringify(shoppingResults));

        // notify 
        let dateStr = moment().format('MMMM Do YYYY @ h:mm a');
        let title = `Shopping Trip on ${dateStr}`;

        let urlToCart = 'https://shop.lowesfoods.com/checkout/cart';
        let urlToSheet = await sheetSource.addShoppingResults(title, moment().unix(), shoppingResults);
        let emailBody = `
            <span><b>Shopping Cart:</b> ${urlToCart}</span><br />
            <span><b>Shopping Results:</b> ${urlToSheet}</span>`;
        let mailOptions = {
            service: config.email.sender.service,
            user: config.email.sender.email,
            password: config.email.sender.appPassword
        };
        mailUtil.sendEmail(config.email.recipeint.sender,
            config.email.recipeint.email,
            title, emailBody, mailOptions);
        logger.info('Shopping trip completed successfully!');
        logger.debug(`URL to cart: ${urlToCart}`);
        logger.debug(`URL to sheet: ${urlToSheet}`);
    } catch (e) {
        logger.error('Error while shopping', e);
    } finally {

        if (shopper) {
            await shopper.shutdown();
        }
    }
})();