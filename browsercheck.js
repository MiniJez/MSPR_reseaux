var express = require('express')
var useragent = require('express-useragent')
var sqlite = require("sqlite3")

module.exports.checkBrowser = function (req, res, next) {
    var source = req.headers['user-agent'];
    var ua = useragent.parse(source);
    var browser = ua.browser;

    // console.log(req.session.username);

    var db = new sqlite.Database("browsers.db3");
    db.each("SELECT * FROM browsers", function(err,row){
        if(err){
            console.log(err);
        }else{
            console.log(row.login+" utilise habituellement : "+row.navigator+"("+row.count+" utilisations)")
        }
    });

    console.log(browser);
    next()
}