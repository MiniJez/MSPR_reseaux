var express = require('express')

module.exports.ipLoggger = function (req, res, next) {
    console.log('LOGGED')
    next()
}
