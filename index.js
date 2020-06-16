const express = require('express')
const app = express()
var path = require('path');

app.use(express.static("public"));

// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + 'public/index.html'));
// });

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
})