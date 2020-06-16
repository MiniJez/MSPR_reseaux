const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: application_secret,
    resave: false,
    saveUninitialized: false
}));

// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + 'public/index.html'));
// });

app.post('/login', (req,res) => {
    let username = req.body.name;
    let password = req.body.password;

    if(username === "mspr" && password === "12345"){
        req.session.username = username;
        req.session.isAuthenticated = true;
    } else {
        res.send(403, "Unauthorized")
    }
});

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
});