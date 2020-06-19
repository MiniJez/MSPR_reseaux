var express = require('express')

const axios = require('axios');



module.exports.ipLoggger = function (req, res, next) {

    var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    axios.get('http://ip-api.com/json/' + ip)
        .then(response => {
            let country = response.data.country
            let status = response.data.status

            if(status =="success"){
                
            }
            
        })
        .catch(error => {
            console.log(error);
        });

    console.log('ip ', ip)


    next()
}
