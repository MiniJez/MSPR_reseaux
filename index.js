require('dotenv').config()
const https = require('https')
const path = require('path');
const fs = require('fs')
const ipcheck = require('./ipcheck');
const { sendEmail } = require('./email');
const sqlite = require("sqlite3").verbose();

//express
const express = require('express')
const useragent = require('express-useragent')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express()

//Brute forcing
const ExpressBrute = require('express-brute');
var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store, {
    freeRetries: 5, //nombres d'essai possible avant d'etre bloquer
    minWait: 500, //500 miliseconds
    maxWait: 1000 * 60 * 15 // 15 minutes
});

//Active directory
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const config = {
    url: 'ldap://portail.chatelet.fr',
    baseDN: 'dc=portail,dc=chatelet,dc=fr'
};
const ad = new ActiveDirectory(config);


//Cron 
const {CheckPwn} = require('./pwnCheck')
const CronJob = require('cron').CronJob;
var job = new CronJob('* * * * * *', function() {
    //TODO : do for all email adresses
    CheckPwn("richardadrien0@gmail.com", "lou.bege@epsi.fr");
}, null, true, 'America/Los_Angeles');
job.start();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(ipcheck.ipLoggger);

/**
 * This route isfor getting the index page.
 * @route GET /
 * @returns {object} 200 - the index page
 * @returns {Error}  default - Unexpected error
 */
app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname + '/public/website/index.html'))
    } else {
        res.redirect('/login')
    }
});

/**
 * This route is for getting the login page
 * @route GET /login
 * @returns {object} 200 - Uthe login page
 * @returns {Error}  default - Unexpected error
 */
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'))
});

/**
 * This route is for login the user in
 * @route POST /login
 * @returns {object} 301 - redirectyion to the correct page
 * @returns {Error}  default - Unexpected error
 */
app.post('/login', bruteforce.prevent, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username, password)

    ad.authenticate(username, password, function (err, auth) {
        if (err) {
            console.log('ERROR-authenticate: ' + JSON.stringify(err));
            res.redirect('/login')
        }
        if (auth) {
            console.log('auth ok')
            req.session.username = username;
            req.session.password = password;

            res.redirect('/login-validation')
        }
        else {
            res.redirect('/login')
        }
    });
});

/**
 * This route is for when the user is correctly authenticated
 * @route GET /login-validation
 * @returns {object} 200 - the page that the user is supposed to acces
 * @returns {Error}  default - Unexpected error
 */
app.get('/login-validation', (req, res) => {
    console.log("login-validation")
    console.log(req.session.username)
    console.log(req.session.password)

    const ad2 = new ActiveDirectory({
        url: 'ldap://portail.chatelet.fr',
        baseDN: 'dc=portail,dc=chatelet,dc=fr',
        bindDN: req.session.username,
        bindCredentials: req.session.password
    });

    ad2.findUser(req.session.username, function (err, user) {
        if (err) {
            console.log('ERROR-findUser: ' + JSON.stringify(err));
            res.redirect('/login')
        } else if (!user) {
            console.log('User: ' + req.session.username + ' not found.');
            res.redirect('/login')
        } else {
            req.session.email = user.mail
            req.session.code = Math.floor(100000 + Math.random() * 900000)

            BrowserCheck(req);
            
            if (req.session.isNewBrowser == false) {
                sendEmail(req.session.email, "Code de vérification pour portail.chatelet.fr", "Your validation code is : " + req.session.code)
            }

            console.log(req.session.email)
            console.log(req.session.code)

            res.sendFile(path.join(__dirname + '/public/login-validation.html'))
        }
    });
})

/**
 * This route is for validating the users connection
 * @route POST /not_found
 * @returns {object} 301 - refirection to the correct page
 * @returns {Error}  default - Unexpected error
 */
app.post('/login-validation', (req, res) => {
    let code = req.body.code;
    console.log('post login-validation')
    console.log(code, req.session.code)
    if (code == req.session.code) {
        console.log("OK code")
        req.session.isAuthenticated = true;
        res.redirect('/')
    } else {
        res.redirect('login-validation')
    }
});

/**
 * This route is for the 404/Not found page.
 * @route GET /not_found
 * @returns {object} 200 - 404 page
 * @returns {Error}  default - Unexpected error
 */
app.get('/not_found', (req, res) => {
    res.status(404).sendFile(path.join(__dirname + '/public/error_pages/not_found.html'))
});

/**
 * This route is for the 404/Not found page.
 * @route GET /unauthorized
 * @returns {object} 401 - Unauthorized page
 * @returns {Error}  default - Unexpected error
 */
app.get('/unauthorized', (req, res) => {
    res.status(401).sendFile(path.join(__dirname + '/public/error_pages/unauthorized.html'))
});

/**
 * This is in case the route is not define, redirect to the 404 page
 * @route GET /*
 * @returns {object} 301 - Redirection to not found page
 */
app.get('*', (req, res) => {
    res.redirect('/not_found')
});

const BrowserCheck = async (req) => {
    console.log("--- Browser check ---")
    var source = req.headers['user-agent'];
    var ua = useragent.parse(source);
    var actualBrowser = ua.browser;
    console.log("Actual browser : " + actualBrowser)

    var username = req.session.username.split("@")[0];
    console.log("Username : " + username)

    var db = new sqlite.Database("database.db3");
    db.serialize(await dbQuery(req, username, actualBrowser, db));
    db.close()

    console.log("--- --- ---")
}

function dbQuery(req, username, actualBrowser, db) {
    return new Promise(function (resolve, reject) {
        db.get("SELECT COUNT(*) as IsExist FROM browsers WHERE login = '" + username + "'", function (err, row) {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                console.log("Is user exists : " + row)
                if (row.IsExist == 0) {
                    console.log("insert")
                    db.run("INSERT INTO browsers VALUES ('" + username + "','" + actualBrowser + "')", function(err){
                        if(err){
                            return console.log(err);
                        }
                        console.log(`A row has been inserted`);
                    });
                    resolve("insert")
                } else {
                    db.get("SELECT * FROM browsers WHERE login = '" + username + "'", function (err, item) {
                        if (err) {
                            console.log(err);
                            reject(err)
                        } else {
                            console.log("Last browser : " + item.navigator)
                            if (item.navigator != actualBrowser) {
                                sendEmail(req.session.email, "Connexion avec un nouveau navigateur à portail.chatelet.fr", "You have a new connecton with "+actualBrowser+", if it's not you, please contact the support. \n Your validation code is : "+req.session.code);
                                setTimeout(function(){
                                    req.session.actualBrowser = actualBrowser
                                    console.log('run db update')
                                    db.run("UPDATE browsers SET navigator = '" + (actualBrowser) + "' WHERE login = '" + username + "'", function(err){
                                        if(err){
                                            return console.log(err);
                                        }
                                        console.log(`A row has been updated`);
                                    });
                                    console.log('end of run')
                                    req.session.isNewBrowser = true
                                    resolve()
                                }, 1500);
                                
                            } else {
                                req.session.isNewBrowser = false;
                                resolve()
                            }
                        }
                    });
                }
            }
        });
    })
} 


https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app)
    .listen(3333, function () {
        console.log('Example app listening on port 3333! Go to https://localhost:3333/')
    })
