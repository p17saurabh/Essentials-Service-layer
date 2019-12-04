"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const uuid = require("uuid/v4");

const questionTable = process.env.QUESTION_TABLE;
// create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
// sorts by date
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else {
    return 1;
  }
}
// create a Question
module.exports.postQuestion = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  const question = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    title: reqBody.title,
    body: reqBody.body,
    user: reqBody.user,
    comments: []
  };

  return db
    .put({
      TableName: questionTable,
      Item: question
    })
    .promise()
    .then(() => {
      callback(null, response(201, question));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

// get all questions

module.exports.getAllQuestions = (event, context, callback) => {
  return db
    .scan({
      TableName: questionTable
    })
    .promise()
    .then(res => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

// get user questions
module.exports.getQuestionByUser = (event, context, callback) => {
  const user = event.pathParameters.user;
  return db
    .scan({
      TableName: questionTable,
      FilterExpression: "#user = :u",
      ExpressionAttributeNames: {
        "#user": "user"
      },
      ExpressionAttributeValues: {
        ":u": user
      }
    })
    .promise()
    .then(res => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

// get  questions by title

module.exports.getQuestionByTitle = (event, context, callback) => {
  const title = event.pathParameters.title;
  return db
    .scan({
      TableName: questionTable,
      FilterExpression: "contains(#title, :t)",
      ExpressionAttributeNames: {
        "#title": "title"
      },
      ExpressionAttributeValues: {
        ":t": title
      }
    })
    .promise()
    .then(res => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

//update question

module.exports.updateQuestion = (event, context, callback) => {
  const id = event.pathParameters.id;
  const body = JSON.parse(event.body);

  const paramName = body.paramName;
  const paramValue = body.paramValue;

  const params = {
    Key: {
      id: id
    },
    TableName: questionTable,
    ConditionExpression: "attribute_exists(id)",
    UpdateExpression: "set " + paramName + " = :v",
    ExpressionAttributeValues: {
      ":v": paramValue
    },
    ReturnValue: "ALL_NEW"
  };

  return db
    .update(params)
    .promise()
    .then(res => {
      callback(null, response(200, res));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};
