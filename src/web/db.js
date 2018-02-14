// load the aws sdk referencing the global instance
AWS = require('aws-sdk');

// utilities for arrays, numbers, objects, strings, etc
var _ = require('lodash');

// utilities for concurrency
var P = require('bluebird');

// promisify all the db methods (aka create async versions)
var DB = new P.promisifyAll(new AWS.DynamoDB());
var DBC = new P.promisifyAll(new AWS.DynamoDB.DocumentClient());

/**
 * The Database class wraps AWS.DynamoDB operations.
 *
 * @param config the config object is the AWS.DynamoDB.createTable() params value which is the schema.
 */
function Database(config) {
    this.schema = config;
    this.table_name = config.TableName;
    this.pkey_name = config.AttributeDefinitions[0].AttributeName;
};

/**
 * Initialize the database.
 *
 * @return a promise object.
 */
Database.prototype.initialize = function() {
    var self = this;

    // query for a list of the existing database tables
    return DB.listTablesAsync().then(function(data) {

        var table_found = _.indexOf(data.TableNames, self.table_name) != -1;

        if (table_found) {
            // the table exists, ensure it is active before returning
            return DB.waitForAsync('tableExists', { 'TableName':self.table_name });
        } else {
            // if the table does not exist then create it
            return self.create();
        }
    });
    // errors are caught by the caller
};

/**
 * Create the table.
 *
 * @return a promise object.
 */
Database.prototype.create = function() {
    var self = this;

    return DB.createTableAsync(self.schema)
        .then(function(data) { return DB.waitForAsync('tableExists', { 'TableName':self.table_name }) } );
    // errors are caught by the caller
};

/**
 * Delete the table.
 *
 * @return a promise object.
 */
Database.prototype.delete = function() {
    var self = this;

    return DB.deleteTableAsync(self.table_name)
        .then(function(data) { return DB.waitForAsync('tableNotExists', { 'TableName':self.table_name }) } );
    // errors are caught by the caller
};

/**
 * Import a data file into the database.
 *
 * @param path the file specification of the json data file.
 * @return a promise object.
 */
Database.prototype.import = function(path) {

    var params = JSON.parse(AWS.util.readFileSync(path));
    return DBC.batchWriteAsync(params);
};

/**
 * List the table entries.
 *
 * @return a promise object.
 */
Database.prototype.list = function() {

    var params = {
      'TableName': this.table_name
    };
    return DBC.scanAsync(params);
};

/**
 * Query the table by index value.
 *
 * @param value the index value which is the first secondary index key.
 * @return a promise object.
 */
Database.prototype.query = function(value) {

    if (!_.has(this.schema, 'GlobalSecondaryIndexes') ||
        !_.isArray(this.schema.GlobalSecondaryIndexes) ||
        !_.has(this.schema.GlobalSecondaryIndexes[0], 'KeySchema') ||
        !_.isArray(this.schema.GlobalSecondaryIndexes[0].KeySchema) ||
        !_.has(this.schema.GlobalSecondaryIndexes[0].KeySchema[0], 'AttributeName')) {
        throw new Error('database does not have an index');
    }

    var index = this.schema.GlobalSecondaryIndexes[0];
    var params = {
      'TableName': this.table_name,
      'IndexName': index.IndexName,
      'KeyConditionExpression': index.KeySchema[0].AttributeName + ' = :v',
      'ExpressionAttributeValues': { ':v': value }
    };
    return DBC.queryAsync(params);
};

/**
 * Get an entry by unique id.
 *
 * @param id the unique id which is the partition key.
 * @return a promise object.
 */
Database.prototype.get = function(id) {

    var params = {
      'TableName': this.table_name,
      'Key': {}
    };
    params.Key[this.pkey_name] = id;
    return DBC.getAsync(params);
};

/**
 * Add an entry.
 *
 * @return a promise object.
 */
Database.prototype.add = function(entry) {

    var params = {
      'TableName': this.table_name,
      'Item': entry
    };
    return DBC.putAsync(params);
};


/**
 * Update an entry.
 *
 * @return a promise object.
 */
Database.prototype.update = function(id,updateExpression,expressionAttributeNames,expressionAttributeValues) {

    var params = {
      'TableName': this.table_name,
      'Key': {},
      'UpdateExpression': updateExpression,
      'ExpressionAttributeNames': expressionAttributeNames,
      'ExpressionAttributeValues': expressionAttributeValues
    };
    params.Key[this.pkey_name] = id;
    return DBC.updateAsync(params);
};

/**
 * Remove an entry.
 *
 * @return a promise object.
 */
Database.prototype.remove = function(id) {

    var params = {
        'TableName': this.table_name,
        'Key': {}
    };
    params.Key[this.pkey_name] = id;
    return DBC.deleteAsync(params);
};

// export the Database class
module.exports = Database;
