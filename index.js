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
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));



app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname + '/public/website/index.html'))
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'))
})

app.post('/login', (req,res) => {
    let username = req.body.username;
    let password = req.body.password;

    if(username === "mspr" && password === "12345"){
        req.session.username = username;
        req.session.isAuthenticated = true;
        res.redirect('/')
    } else {
        res.send(403, "Unauthorized")
    }
});

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
});