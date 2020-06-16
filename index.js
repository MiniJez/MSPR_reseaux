const express = require('express')
const app = express()

app.get('/', function (req, res) {
    res.send('Hello World! Hot reloading')
})

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
})