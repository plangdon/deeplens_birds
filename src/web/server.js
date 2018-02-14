const express = require('express')
const app = express()

var fs = require('fs');
var _ = require('lodash');

// load the server configuration
 var config = JSON.parse(fs.readFileSync('server.json'));

 ////////////////// AWS Dynamo
 // load the aws sdk into a global value so other modules can access the same instance
 AWS = require('aws-sdk');

// configure aws region before other modules
AWS.config.update({ region:config.aws.region });


// load an alternate aws configuration
if (!_.isEmpty(config.aws.config)) {
    log_orchestrator.notice('loading config %s', config.aws.config);
    AWS.config.loadFromPath(config.aws.config);
}


// load the database module
var Database = require('./db.js');

// create the backyard_counter database interface
var backyard_counter = new Database(config.db.backyard_counter);

var port = 9080;

app.get('/', function(req, res) {
  var birdCount = 5;
  var squirrelCount = 7;

  var outputHTML = '<table border="1" cellpadding="10" cellspacing="10" style="font-size:2em;margin:0px;padding:10px;"><tr><td>Birds</td><td>Squirrels</td></tr><tr><td>' + birdCount + '</td><td>' + squirrelCount + '</td></tr></table>';
  res.send(outputHTML);
});

app.listen(port, () => console.log('Example app listening on port 9080!'))


// initialize the database tables and then the http server
 return backyard_counter.initialize()
 .then(function(data) {
   console.log('Database Initialized!');
 })

//
// app.get('/stats', function(req, res) {
//
//     // backyard_counter.get('non-existant-accessory-id')
//     //     .then(function(data) { return users.get('non-existant-user-id'); })
//     //     //.then(function(data) { return iotjs_health(); })
//     //     .then(function(data) {
//     //         res.sendStatus(204);
//     //     }).catch(function(err) {
//     //         res.sendStatus(500);
//     //     });
// });