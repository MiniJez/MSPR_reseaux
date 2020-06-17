var express = require('express')
var useragent = require('express-useragent')

module.exports.checkBrowser = function (req, res, next) {
    console.log('LOGGED');
    var source = req.headers['user-agent']
    var ua = useragent.parse(source);
    console.log(ua.browser);
    next()
}