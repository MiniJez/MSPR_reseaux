var express = require('express')
var useragent = require('express-useragent')
var sqlite = require("sqlite3")
const mail = require('./email');


module.exports.checkBrowser = function (req, res, next) {
    
    next()
}