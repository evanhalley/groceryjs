'use strict';
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'];

const RANGE = 'A1:C50';

class SheetsGrocerySource {

    constructor(logger, clientEmail, privateKey, spreadsheetId) {
        this._logger = logger;
        this._clientEmail = clientEmail;
        this._privateKey = privateKey;
        this._spreadsheetId = spreadsheetId;
        this._spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    }

    async init() {
        // authorize a new Google API client
        let _ = this;
        this._logger.debug('Initializing a new Google API client');
        let googlAuthClient = await new Promise((resolve, reject) => {
            let client = new google.auth.JWT(
                _._clientEmail,
                null,
                _._privateKey,
                SCOPES,
                null
            );
            client.authorize((err, tokens) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(client);
                }
            });
        });

        // initialize a new Google Sheets client
        this._logger.debug('Initializing a new Google Sheets & Drive clients');
        google.options({ auth: googlAuthClient });
        this._sheetsService = google.sheets({version: 'v4'});
        this._driveService = google.drive({version: 'v3'});
    }

    async getUrlToSheet(spreadsheetId) {
        return new Promise((resolve, reject) => {
            resolve(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        });
    }

    async getGroceryList() {
        let spreadsheetId = this._spreadsheetId;
        let sheetsService = this._sheetsService;

        return await new Promise((resolve, reject) => {
            sheetsService.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: RANGE
              }, (err, result) => {
                if (err) {
                    reject(err);
                } else if (result && result.data && result.data.values) {
                    let items = [];

                    for (let i = 1; i < result.data.values.length; i++) {
                        let value = result.data.values[i];
                        items.push({ name: value[0], quantity: value[1] });
                    }
                    resolve(items);
                } else {
                    resolve([]);
                }
            });
        });
    }

    async addShoppingResults(title, sheetId, results) {
        let sheetsService = this._sheetsService;
        let spreadsheetId = this._spreadsheetId;

        return new Promise((resolve, reject) => {
            let requests = [];
            let idx = 1;

            // convert results to an array we can write
            let data = [];

            let headers = [
                { userEnteredValue: { stringValue: 'Requested' } },
                { userEnteredValue: { stringValue: 'Item' } },
                { userEnteredValue: { stringValue: 'Price' } },
            ];
            data.push({ values: headers });

            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                let row = [];
                row.push({ userEnteredValue: { stringValue: result.requested } });

                if (result.result) {
                    row.push({ userEnteredValue: { stringValue: result.result.title } });
                    row.push({ userEnteredValue: { numberValue: result.result.price } });
                }
                data.push({ values: row });
            }

            // add the sheet
            requests.push({ 
                addSheet: {
                    properties: {
                        sheetId: sheetId,
                        title: title,
                        index: idx,
                        sheetType: 'GRID',
                        gridProperties: {
                            rowCount: data.length,
                            columnCount: 3
                        }
                    } 
                }
            });

            // updateCells request
            requests.push({ 
                updateCells: {
                    rows: data ,
                    fields: '*',
                    start: {
                        sheetId: sheetId,
                        rowIndex: 0,
                        columnIndex: 0
                    }
                }
            });
            
            // auto size things
            requests.push({
                autoResizeDimensions: {
                    dimensions: {
                        sheetId: sheetId,
                        dimension: "COLUMNS",
                        startIndex: 0,
                        endIndex: 3
                  }
                }
            });

            // execute the batch update
            sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: { requests: requests }
            }, (err, result) => {
                    
                if (err) {
                    reject(err);
                } else {
                    resolve(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`);
                }
            });
        });
    }
}

module.exports = {SheetsGrocerySource: SheetsGrocerySource};