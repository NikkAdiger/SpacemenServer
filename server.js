const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const MongoClient = require('mongodb').MongoClient;
const configConnect = require('./config/config.json').connectionDB;
const url = 'mongodb://' + configConnect.login + ':' + configConnect.password + configConnect.urlBase + configConnect.nameBase;
const urlAPI = 'http://api.open-notify.org/astros.json';
const port = process.env.PORT || configConnect.port;
const app = express();

let headers = require('./config/headers');
let db;
let ObjectID = require('mongodb').ObjectID;
app.use(bodyParser.urlencoded({extended: true}));

function deleteAllSpacemen() {
    return new Promise(function (resolve, reject) {

        db.collection(configConnect.nameBase).deleteMany({}, (err, res) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            console.log('Deleted success');
            return resolve(res);
        });
    })
}

function getSpacemen() {
    return new Promise(function (resolve, reject) {

        http.get(urlAPI, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                let spacemen = JSON.parse(data).people;
                console.log('Geted success');
                resolve(spacemen);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    });
}

function addSpacemen(spacemen) {
    console.log("ADD SPACEMEN", spacemen);
    return new Promise(function (resolve, reject) {

        db.collection(configConnect.nameBase).insertMany(spacemen, (err, res) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            console.log('Added success');
            return resolve(res);
        });
    });
};

module.exports = MongoClient.connect(url, {useNewUrlParser: true}, (err, client) => {
    if (err) return console.log(err);
    db = client.db(configConnect.nameBase);

// Refresh BD ///

    console.log('Begining ...');

    deleteAllSpacemen()
        .then(getSpacemen)
        .then((spacemen) => addSpacemen(spacemen));

    app.listen(port, () => {
        console.log('listening on:', port);
    })
});

app.use('*', function (req, res, next) {
    headers.setHeaders(res);
    next();
});

app.get('/', (req, res) => {
    let cursor = db.collection('quotes').find();
});

app.get('/spacemen', (req, res) => {
    db.collection(configConnect.nameBase).find().toArray((err, result) => {
        if (err) return console.log(err);
        res.send(result);
    })
});
