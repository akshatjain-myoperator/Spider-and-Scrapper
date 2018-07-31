var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var mongoose = require('mongoose');

// Setup a default port
var port = process.env.PORT || 8080;

// Middleware Configurations
app.use(bodyParser.json());
app.use(bodyParser.json({
    type: 'application/vnd+api.json'
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost:27017/spider_and_scrapper', {
    useNewUrlParser: true
}, function (err) {
    if (err) throw err;
    console.log('Successfully connected');
});

// Initialize routes
require('./app/routes')(app);

// Start the server
app.listen(port);
console.log('Server started on the url: http://localhost:' + port + '/');
exports = module.exports = app;