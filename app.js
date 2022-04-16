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
  let nowTimeStamp = new Date();
  connection.query(
    'INSERT INTO timestamps (username,begin_time) VAlUES("yuki",?)',
    [nowTimeStamp],
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

app.get('/finish', (rew, res) => {
  connection.query(
    'SELECT finish_time FROM timestamps ORDER BY id DESC LIMIT 1',
    (error,results) => {
      const latest_finish_time = results.finish_time
      console.log(latest_finish_time);
      if(latest_finish_time === undefined){
        res.redirect('/finish_normal');
      }else{
        res.redirect('/finish_abnormal');
      }
    }
  );
});

app.get('/finish_normal', (rew, res) => {
  let nowTimeStamp = new Date();
  connection.query(
    'UPDATE timestamps SET finish_time = ? WHERE id in (SELECT id FROM (SELECT id FROM timestamps ORDER BY id DESC LIMIT 1)tmp)',
    [nowTimeStamp],
    (error, results) => {
      res.render('hello,ejs')
    }
  );
});

app.get('/finish_abnormal', (rew, res) => {
  let nowTimeStamp = new Date();
  connection.query(
    'INSERT INTO timestamps (username,finish_time) VAlUES(?,?)',
    ["yuki",nowTimeStamp],
    (error,results) => {
      res.render('hello,ejs')
    }
  );
});


app.listen(3000);