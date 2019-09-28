'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({apiVersion:'2012-08-10'});
const uuid = require('uuid/v4')

const userTable = process.env.USER_TABLE
// create a response
function response(statusCode,message){
  return {
    statusCode : statusCode,
    body: JSON.stringify(message)
  };
}
// sorts by date
function sortByDate(a,b){
  if(a.createdAt > b.createdAt){
    return -1;
  }
  else{
    return 1;
  }
}
// create a user 
module.exports.createUser = (event,context,callback) => {
  const reqBody = JSON.parse(event.body);

  const user = {
      id :  uuid(),
      createdAt : new Date().toISOString(),
      title: reqBody.title,
      body: reqBody.body
  };

  return db.put({
    TableName: userTable,
    Item: user
  }).promise().then(() => {
    callback(null, response(201, user))
  }).catch(err => response(null,response(err.statusCode,err)));
}

// get all users 

module.exports.getAllUsers = (event, context , callback) => {

  return db.scan({
    TableName: userTable
  }).promise().then(res => {
    callback(null,response(200,res.Items.sort(sortByDate)))
  }).catch(err => callback(null,response(err.statusCode,err)));
}

