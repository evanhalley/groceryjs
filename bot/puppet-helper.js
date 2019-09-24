'use strict';
const puppeteer = require('puppeteer');

class PuppetHelper {

    constructor(logger) {
        this._logger = logger;
        this._page = null;
    }

    async start(options) {
        this._logger.info('Initialzing shopper...');

        try {
            this._logger.debug('Launching web browser...');
            let browser = await puppeteer.launch({ 
                headless: options.headless,
                defaultViewport: {
                    width: options.width,
                    height: options.height
                },
                args: [
                    `--window-size=${options.width},${options.height}`
                ],
            });
            this._page = await browser.newPage();
            await this._page.setJavaScriptEnabled(true);
            await this._page.setCacheEnabled(false);
        } catch (e) {
            this._logger.error("Error initializing the shopper", e);
            throw e;
        }
    }

    async goToUrl(url) {
        this.assertPageOpen();
        await this._page.goto(url, { waitUntil: 'networkidle0' });
    }

    getUrl() {
        this.assertPageOpen();
        this._page.url();
    }

    async getTextFromElement(element) {
        this.assertPageOpen();
        return await this._page.evaluate(el => el.innerText, element);
    }

    async getAttributeFromElement(element, selector, attrName) {
        this.assertPageOpen();
        return await element.$eval(selector, (e, attrName) => e.getAttribute(attrName), attrName);
    }

    async getElement(selector) {
        this.assertPageOpen();
        return await this._page.$(selector);
    }
    
    async getElementFromParent(parent, selector) {
        this.assertPageOpen();
        return await parent.$(selector);
    }
    
    async getElementsFromParent(parent, selector) {
        this.assertPageOpen();
        return await parent.$$(selector);
    }

    async clearText(selector) {
        this.assertPageOpen();
        let element = await this._page.$(selector);
        await element.click({clickCount: 3});
        await element.press('Backspace'); 
    }

    async selectFromDropdown(selector, value) {
        await this._page.select(selector, value);
    }

    async clickButtonInParent(parent, selector, clickCount = 1) {
        this.assertPageOpen();
        let button = await parent.$(selector);
    
        if (button) {
            await button.click({ clickCount: clickCount });
        } else {
            throw new Error(`Unable to click ${selector}`);
        }
    }

    async clickButton(selector, clickCount = 1) {
        this.assertPageOpen();
        let button = await this._page.$(selector);
    
        if (button) {
            await button.click({ clickCount: clickCount });
        } else {
            throw new Error(`Unable to click ${selector}`);
        }
    }

    async enterText(selector, text) {
        this.assertPageOpen();
        let input = await this._page.$(selector);
    
        if (input) {
            await input.type(text);
        } else {
            throw new Error(`Unable to enter text into ${selector}`);
        }
    }

    async doesElementExistInParent(parent, selector) {
        this.assertPageOpen();
        let element = await parent.$(selector);
        return element != null;
    }

    async doesElementExist(selector) {
        this.assertPageOpen();
        let element = await this._page.$(selector);
        return element != null;
    }

    async close() {
        this.assertPageOpen();
        await this._page.browser().close();
    }

    waitTilLoadDone() {
        
    }

    wait(sleepTimeMs) {
        return new Promise(res => setTimeout(res, sleepTimeMs))
    }

    assertPageOpen() {

        if (!this._page) {
            throw new Error('Page is null.  Have you started the browser?');
        }
    }
}

module.exports = {PuppetHelper: PuppetHelper};