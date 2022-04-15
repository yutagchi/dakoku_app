const express = require('express');
const mysql = require('mysql');

const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'yuki',
  database: 'timecard_app'
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});

app.get('/', (req, res) => {
  let getTime = new Date();
  let nowHour = getTime.getHours();
  let nowMin  = getTime.getMinutes();
  let nowSec  = getTime.getSeconds();
  let nowTime = nowHour + ":" + nowMin + ":" + nowSec;
  res.render('hello.ejs',{now: nowTime});
});

app.get('/begin', (rew, res) => {
  let getTime = new Date();
  connection.query(
    'INSERT INTO timestamps (username,status,timestamp) VAlUES("yuki","bigin",?)',
    [getTime],
    (error, results) => {
      console.log(nowTime);
      res.redirect('/');
    }
  );
});

app.get('/finish', (rew, res) => {
  let getTime = new Date();
  connection.query(
    'INSERT INTO timestamps (username,status,timestamp) VAlUES("yuki","finish",?)',
    [getTime],
      (error, results) => {
      res.redirect('/');
    }
  );
});

app.get('/timestamp_list', (rew, res) => {
connection.query(
  'SELECT * FROM timestamps',
  (error, results)=> {
  res.render('timestamp_list.ejs',{timestamps: results});
  }
);
  
});

app.listen(3000);