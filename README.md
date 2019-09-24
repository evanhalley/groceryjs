# grocerjs
A new JavaScript framework for ordering groceries!

## Setting Up

### Step 1

To support interaction with Google Sheets, create a [Google API Console project](https://console.developers.google.com/apis/dashboard).  Be sure to enable the Google Drive & Google Sheets APIs.

Once you have create the API console project, Create a [JSON Service Account Key](https://console.developers.google.com/apis/credentials/serviceaccountkey)

Download the service account key and place it in the `config/` folder in the GroceryJS project.

The account key should resemble:

```json
{
  "type": "service_account",
  "project_id": "foo-123",
  "private_key_id": "abcdefghijklmnopqrstuvwxyz",
  "private_key": "-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----\n",
  "client_email": "foo-123@appspot.gserviceaccount.com",
  "client_id": "107846451311061568155",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/foo-123%40appspot.gserviceaccount.com"
}

```

### Step 2

Create the Google Sheet that will store your Google Sheet.  Share the Google Sheet with the email address `client_email` found in the JSON service account key.  Note the Google Sheet ID. It's required for the following step.

`https://docs.google.com/spreadsheets/d/[Google-Sheet-ID-Here]/edit#gid=0`

### Step 3

Create a file in the `config/` folder, named `config.js`.

The contents:

```javascript
const config = {
    shopper: {
        email: "[Lowes Foods - Foods To Go Username]",
        password: "[Lowes Foods - Foods To Go Paswword]",
        headless: false
    },
    source: {
        sheetId: "[ID of the Google Sheet holding your grocery list]"
    },
    email: {
        sender: {
            service: 'gmail',
            email: '[GMail email address to send the summary email from]',
            appPassword: 'GMail app password ]'
        },
        recipeint: {
            email: '[The email address to receive the summary email]',
            sender: '[The email address of the sender]'
        }
    }
}

module.exports = config;
```