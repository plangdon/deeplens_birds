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

var $credentials = {
      "accessKeyId": "AKIAIBDTZN6IACU5TILA",
      "secretAccessKey": "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",
      "region": "us-east-1"
}

var DynamoDB = require('aws-dynamodb')($credentials)


// load the database module
var Database = require('./db.js');

// create the backyard_counter database interface
var backyard_counter = new Database(config.db.backyard_counter);

var port = 9080;

app.get('/', function(req, res) {

  updateCounts().then(function(){
    var birdCount = birdData.length;
    var squirrelCount = squirrelData.length;

    var outputHTML = '<table border="1" cellpadding="10" cellspacing="10" style="font-size:2em;margin:0px;padding:10px;"><tr><td>Birds</td><td>Squirrels</td></tr><tr><td>' + birdCount + '</td><td>' + squirrelCount + '</td></tr></table>';
    res.send(outputHTML);
  })

});

app.listen(port, () => console.log('Example app listening on port 9080!'))


var newData = [];
var birdData = [];
var squirrelData = [];
var alldata = [];


function updateCounts() {
    return new Promise(function(resolve, reject) {
     // continous scan until end of table
     (function recursive_call( $lastKey ) {
         DynamoDB
             .table('backyard_counter')
             .resume($lastKey)
             .scan(function( err, data ) {
                 // handle error, process data ...
                 newData.push(data);
                 if (this.LastEvaluatedKey === null) {
                     counters();
                     resolve(newData);
                 }
                 var $this = this
                 setTimeout(function() {
                     recursive_call($this.LastEvaluatedKey);
                 },1000)
             })
     })(null)
   });
  }

  function counters(){
    return new Promise(function(resolve, reject) {
      updateCounts().then(function(){

        var i = 0;
        for (i=0;i<newData.length;i++) {
           var ii;
           var tempData = newData[i];
          for (ii=0;ii<tempData.length;ii++) {
            var row = {
              timestamp : tempData[ii].timestamp,
              msg: tempData[ii].msg
            };
            alldata.push(row);
          }
        }




        for (i=0;i<alldata.length;i++) {
          //newData[i] = JSON.parse(newData[i]);
          //console.log("++++");
          //console.log(alldata[i]);
          //console.log("----");
          if (alldata[i].hasOwnProperty('msg')) {
            console.log(alldata[i].msg);
            if (alldata[i].msg.toString().indexOf('bird')!=-1){
              birdData.push(alldata[i]);
            }

            if (alldata[i].msg.toString().indexOf('squirrel')!=-1){
              squirrelData.push(alldata[i]);
            }
          }
          resolve("done");
        }



      });
    });
  }


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