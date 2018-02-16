#DeepLens Project for Bird Identification

The project is arranged in the following:

/src - All source
/src/web - Web server code to connect to DynamoDB and display counts of Birds vs. Squirrels at the birdfeeder.
/src/iot/ - the jsom rule file  ** you will need to modify to you role and topic name
/src/lambda - the lambda code that gets deployed to Greengrass on DeepLens hardware
/src/dynamodb - the json definition of the Dynamo tables


/models are the MXNet models being trained for bird species Identification