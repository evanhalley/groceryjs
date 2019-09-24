'use strict';
const PuppetHelper = require('./puppet-helper').PuppetHelper;
const currency = require('currency.js');

const XLONG = 12000;
const LONG = 10000;
const MID = 4000;
const SHORT = 2000;
const MINI = 1000;
const NANO = 500;
const SHOPPING_URL = 'https://shop.lowesfoods.com/';

class LowesShopper {

    constructor(logger) {
        this._logger = logger;
        this._puppetHelper = new PuppetHelper(logger);
    }

    async processCommand(command, params) {
        
        switch (command) {
            case "login":
                await this.login(params.email, params.password);
                break;
            case "clear_cart":
                await this.emptyCart();
                break;
            case "add_to_cart":
                await this.addItemToCart(params.name, params.quantity)
                break;
            case "show_cart":
                await this.showCart();
                break;
            case "screenshot":
                break;
        }
    }

    async init(headless) {
        await this._puppetHelper.start({ headless: headless, width: 1280, height: 1024 });
    }

    async shutdown() {
        await this._puppetHelper.close();
    }

    async login(email, password) {
        this._logger.info(`Logging into account ${email}...`);
        await this._puppetHelper.goToUrl(SHOPPING_URL);
        await this._puppetHelper.clickButton('#loyalty-onboarding-dismiss');
        await this._puppetHelper.wait(SHORT);
        await this._puppetHelper.clickButton('#shopping-selector-parent-process-modal-close-click');
        await this._puppetHelper.wait(SHORT);
        await this._puppetHelper.clickButton('#nav-register');
        await this._puppetHelper.wait(SHORT)
        await this._puppetHelper.enterText('#login-email', email);
        await this._puppetHelper.wait(SHORT)
        await this._puppetHelper.enterText('#login-password', password);
        await this._puppetHelper.wait(SHORT)
        await this._puppetHelper.clickButton('#login-submit');
        await this._puppetHelper.wait(XLONG);
    }

    async getUrlToCart() {
        await this.showCart();
        return this._puppetHelper.getUrl();
    }

    async addItemsToCart(items) {
        this._logger.info(`Attempting to add ${items.length} items to cart...`);

        for (let i = 0; i < items.length; i++) {
            await this.addItemToCart(items[i].name, items[i].quantity);
        }
    }

    async addItemToCart(name, quantity) {
        this._logger.info(`Attempting to add ${quantity} of ${name} to cart...`);
        let productDivs = await this.searchImpl(name);
        let item = null;
        let firstPreviouslyPurchased = null;
        let firstPreviouslyPurchasedIdx = -1;
        let firstItem = null;
        let firstItemIdx = -1;

        if (productDivs && productDivs.length > 0) {

            /*
             * Loops over every result and finds the first item and the first previously purchased item
             * We prefer the first previously purchased item
             * */
            for (let i = 0; i < productDivs.length; i++) {
                let productDiv = productDivs[i];
                let item = await this.divToItem(productDiv);

                if (i == 0) {
                    firstItem = item;
                    firstItemIdx = i;
                } else if (item.wasPreviousPurchase == true && !firstPreviouslyPurchased) {
                    firstPreviouslyPurchased = item;
                    firstPreviouslyPurchasedIdx = i;
                }
            }
            let productDiv = null;
            item = firstItem;

            if (firstPreviouslyPurchased) {

                if (firstItem.wasPreviousPurchase) {
                    productDiv = productDivs[firstItemIdx];
                    item = firstItem;
                } else {
                    productDiv = productDivs[firstPreviouslyPurchasedIdx];
                    item = firstPreviouslyPurchased;
                }
            } else {
                productDiv = productDivs[firstItemIdx];
                item = firstItem;
            }

            if (await this._puppetHelper.doesElementExistInParent(productDiv, 'button.full.cart.add')) {

                // the loop is a workaround, clicking on the add to cart button more than once throw an error
                // because the button becomes detached and replaced after clicking it once
                for (let i = 0; i < quantity; i++) {
                    await this._puppetHelper.clickButtonInParent(productDiv, 'button.full.cart.add');
                }
            } else {
                // it's a drop down to select by weight
                let addToCartSelectId = await this._puppetHelper.getAttributeFromElement(productDiv, 'select.ng-pristine.ng-valid', 'id');
                await this._puppetHelper.selectFromDropdown(`#${addToCartSelectId}`, `number:${quantity}`);
            }
        }
        return item;
    }
   
    async showCart() {
        this._logger.info(`Opening the shopping cart...`);
        await this._puppetHelper.clickButton('#nav-cart-main-checkout-cart');
        await this._puppetHelper.wait(MID);
    }

    async emptyCart() {
        this._logger.info(`Emptying cart...`);
        await this.showCart();
        await this._puppetHelper.clickButton('#checkout-cart-empty');
        await this._puppetHelper.wait(NANO);
        await this._puppetHelper.clickButton('#error-modal-ok-button');
        await this._puppetHelper.wait(MINI);
    }

    async divToItem(div) {

        if (!div) {
            return null;
        }

        let itemImageUrl = await this._puppetHelper.getAttributeFromElement(div, 'a.cell-image', 'data-src');
        let titleSpan = await this._puppetHelper.getElementFromParent(div, '.cell-title-text');
        let priceSpan = null;
        let salePriceDiv = await this._puppetHelper.getElementFromParent(div, '.price.sale');
        let isOnSale = false;
        let wasPreviousPurchase = await this._puppetHelper.getElementFromParent(div, '.purchased') ? true : false;
        
        if (salePriceDiv) {
            priceSpan = await this._puppetHelper.getElementFromParent(salePriceDiv, '.amount');
            isOnSale = true;
        } else {
            priceSpan = await this._puppetHelper.getElementFromParent(div, '.amount');
        }

        if (titleSpan && priceSpan) {
            let priceText = await this._puppetHelper.getTextFromElement(priceSpan);
            let price = null;

            if (priceText.indexOf('for') > -1) {
                let priceTextArr = priceText.split('for');
                let totalSalePrice = currency(priceTextArr[1].trim()).value;
                let totalSaleQuantity = parseInt(priceTextArr[0].trim());
                price = totalSalePrice / totalSaleQuantity;
            } else {
                price = currency(priceText).value;
            }

            return {
                title: await this._puppetHelper.getTextFromElement(titleSpan),
                price: currency(price).value,
                priceText: priceText,
                onSale: isOnSale,
                imageUrl: itemImageUrl,
                wasPreviousPurchase: wasPreviousPurchase
            };
        }
    }

    async search(query) {
        this._logger.info(`Searching for ${query}`);
        let products = [];
        let productDivs = await this.searchImpl(query);

        if (!productDivs) {
            return products;
        }

        for (let i = 0; i < productDivs.length; i++) {
            products.push(await this.divToItem(productDivs[i]));
        }
        return products;
    }

    async searchImpl(query) {
        this._logger.info(`Searching for ${query}`);
        let productDivs = null;
        await this._puppetHelper.clearText('#search-nav-input');
        await this._puppetHelper.enterText('#search-nav-input', query);
        await this._puppetHelper.wait(SHORT);
        await this._puppetHelper.clickButton('#search-nav-search');
        await this._puppetHelper.wait(MID);
        // body > div:nth-child(5) > div > div > div.content-wrapper > div > lazy-load > ol
        let resultsDiv = await this._puppetHelper.getElement('ol.cell-container');
    
        if (resultsDiv) {
            productDivs = await this._puppetHelper.getElementsFromParent(resultsDiv, '.cell.product-cell');
        }
        return productDivs;
    }
}

module.exports = {bot: LowesShopper};