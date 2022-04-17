const express = require('express');
const mysql = require('mysql');
const app = express();

//body-parser使えるように
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//mysql接続情報
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

//ここから本体

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
    'UPDATE timestamps SET timediff = (timediff(finish_time,begin_time))',
    (error, results) => {
    }
  );
  connection.query(
    'SELECT * FROM timestamps',
      (error, results)=> {
      res.render('timestamp_list.ejs',{timestamps: results});
    }
  ); 
});

app.get('/edit/:id', (req, res) => {
  connection.query(
    'SELECT * FROM timestamps WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('edit.ejs', {timestamp: results[0]});
    }
  );
});

app.post('/update/:id', (req, res) => {
  console.log(req.body.begin_time);
  console.log(req.body.finish_time);
  console.log(req.params.id);
  connection.query(
    'UPDATE timestamps SET begin_time = ?, finish_time = ? WHERE id = ?',
    [req.body.begin_time, req.body.finish_time, req.params.id],
    (error, results) => {
      res.redirect('/timestamp_list');
    }
  );
});

app.get('/finish', (rew, res) => {
  connection.query(
    'SELECT finish_time FROM timestamps ORDER BY id DESC LIMIT 1',
    (error,results) => {
      console.log(results)
      let latest_finish_time = results[0].finish_time
      console.log(latest_finish_time);
      if(latest_finish_time === null){
        res.redirect('/finish_normal');
        console.log("未定義");
      }else{
        res.redirect('/finish_abnormal');
        console.log("定義済み")
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
    }
  );
});

app.get('/finish_abnormal', (rew, res) => {
  let nowTimeStamp = new Date();
  connection.query(
    'INSERT INTO timestamps (username,finish_time) VAlUES(?,?)',
    ["yuki",nowTimeStamp],
    (error,results) => {
      res.redirect('/');
    }
  );
});


app.listen(3000);