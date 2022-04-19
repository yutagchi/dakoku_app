//下準備
const express = require('express');
const mysql = require('mysql');
const app = express();

//body-parser使えるように
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//mysqlの準備
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

//トップ
app.get('/', (req, res) => {

  //リセット
  connection.query(
    'DELETE FROM work_time_today',
    (error_delete,results_delete) =>{}
  );
  
  //今日のyyyy-mm-ddを取得
  function set2fig(num) {
    // 桁数が1桁だったら先頭に0を加えて2桁に調整する
    var ret;
    if( num < 10 ) { ret = "0" + num; }
    else { ret = num; }
    return ret;
  }

  let nowTime = new Date();
  let nowYear = nowTime.getFullYear();
  let nowMonth = set2fig( nowTime.getMonth()+1 );
  let nowDate = set2fig( nowTime.getDate() );
  var yyyymmddDate = nowYear + "-" + nowMonth + "-" + nowDate;
  console.log(yyyymmddDate);

  //今日のやつをコピー
  connection.query(
    'INSERT INTO work_time_today SELECT * FROM timestamps WHERE convert(begin_time,date) = ?',
    [yyyymmddDate],
    (error_insertWT,results_insertWT) =>{}
  );

  //出退勤のステータスを入れる配列を用意（なぜかconnection.queryの中だと動かん）
  var nowAtWork = [];

  //もし出勤中だったらfinifh_time入力
  connection.query(
    'SELECT * FROM work_time_today ORDER BY begin_time DESC LIMIT 1',
    (error_addFT,results_addFT) => {

      let latest_finish_time = results_addFT[0].finish_time
      let nowTimeStamp = new Date();
      console.log(latest_finish_time);
  
      console.log(nowAtWork);

      if(latest_finish_time === null){
        console.log("未定義");
        nowAtWork.push("勤務中");
        connection.query(
          'UPDATE work_time_today SET finish_time = ? WHERE id in (SELECT id FROM (SELECT id FROM timestamps ORDER BY id DESC LIMIT 1)tmp)',
          [nowTimeStamp],
          (error_addFTDone, results_addFTDone) => {}
        );
      }else{
        nowAtWork.push("退勤済み");
      }
    }
  );

  connection.query(
    'SELECT sec_to_time(sum(timediff)) as timediff from work_time_today',
    (error_timediffSum,results_timediffSum) => {
      console.log(results_timediffSum[0]);
      res.render('home.ejs',{timediff: results_timediffSum[0],nowAtWork: nowAtWork[0]});
    }
  )
});

//打刻一覧
app.get('/timestamp_list', (rew, res) => {
  connection.query(
    'UPDATE timestamps SET timediff = (timediff(finish_time,begin_time))',
    (error, results) => {
    }
  );
  connection.query(
    'SELECT id, timediff, begin_time, finish_time from timestamps',
      (error, results)=> {
      res.render('timestamp_list.ejs',{timestamps: results});
    }
  ); 
});

//打刻編集
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

//打刻削除
app.get('/confirm_delete/:id', (req, res) => {
  connection.query(
    'SELECT * FROM timestamps WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('confirm_delete.ejs', {timestamp: results[0]});
    }
  );
});

app.post('/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM timestamps WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('delete.ejs', {timestamp: results[0]});
    }
  );
});

//打刻追加
app.get('/add_timestamp_edit', (req, res) => {
      res.render('add_timestamp_edit.ejs');
});

app.post('/add_timestamp', (req, res) => {
  connection.query(
    'INSERT INTO timestamps (username,begin_time,finish_time) VAlUES("yuki",?,?)',
    [req.body.begin_time, req.body.finish_time],
    (error, results) => {
      res.redirect('add_timestamp_done');
    }
  );
});

app.get('/add_timestamp_done', (req, res) => {
  res.render('add_timestamp_done.ejs');
});

//打刻一覧（日ごと）
app.get('/timestamp_list_gb_days', (rew, res) => {
  connection.query(
    'UPDATE timestamps SET timediff = (timediff(finish_time,begin_time))',
    (error, results) => {
    }
  );
  connection.query(
    'select convert(sum(timediff),time) as timediff,convert(begin_time,date) as date  from timestamps group by convert(begin_time,date);',
      (error, results)=> {
        res.render('timestamp_list_gb_days.ejs',{timestamps: results});
    }
  ); 
});

//出勤
app.get('/begin', (rew, res) => {
  let nowTimeStamp = new Date();
  connection.query(
    'INSERT INTO timestamps (username,begin_time) VAlUES("yuki",?)',
    [nowTimeStamp],
    (error, results) => {
      res.redirect('/begin_done');
    }
  );
});

app.get('/begin_done', (req, res) => {
  connection.query(
    'SELECT content FROM setting WHERE id IN (4,5)',
    (error_settings, results_settings) => {
      connection.query(
        'SELECT * FROM todolist',
        (error_todolist,results_todolist) => {
          res.render('begin_done.ejs',{settings: results_settings,tasks: results_todolist})
        }
      );
    }
  );
});

//退勤
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
      res.redirect('/finish_done');
    }
  );
});

app.get('/finish_abnormal', (rew, res) => {
  let nowTimeStamp = new Date();
  connection.query(
    'INSERT INTO timestamps (username,finish_time) VAlUES(?,?)',
    ["yuki",nowTimeStamp],
    (error,results) => {
      res.redirect('/finish_done');
    }
  );
});

app.get('/finish_done', (req, res) => {
  connection.query(
    'SELECT content FROM setting WHERE id IN (4,6)',
    (error_settings, results_settings) => {
      connection.query(
        'SELECT * FROM todolist',
        (error_todolist, results_todolist) => {
          res.render('finish_done.ejs',{settings: results_settings,tasks: results_todolist})
        }
      );
    }
  );
});

//TODOリスト
app.get('/todolist', (req, res) => {
  connection.query(
    'SELECT * FROM todolist',
    (error, results) => {
      res.render('todolist.ejs',{tasks: results});
    }
  )
});

app.get('/todolist/add', (req, res) => {
  res.render('todolist_add.ejs');
});

app.post('/todolist/add/update', (req, res) => {
  connection.query(
    'INSERT INTO todolist(name) values(?)',
    [req.body.newtask],
    (error, results) => {
      res.redirect('/todolist');
    }
  )
});

app.get('/todolist/edit/:id', (req, res) => {
  connection.query(
    'SELECT id,name FROM todolist WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('todolist_edit.ejs', {task: results[0]});
    }
  );
});

app.post('/todolist/update/:id', (req, res) => {
  connection.query(
    'UPDATE todolist SET name = ? WHERE id = ?',
    [req.body.newtask, req.params.id],
    (error, results) => {
      res.redirect('/todolist');
    }
  );
});

app.get('/todolist/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM todolist WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.redirect('/todolist');
    }
  );
});

//設定画面
app.get('/setting', (req, res) => {
  connection.query(
    'SELECT * FROM setting',
    (error, results) => {
      res.render('setting.ejs',{settings: results});
    }
  );
});

app.get('/setting/edit/:id', (req, res) => {
  connection.query(
    'SELECT * FROM setting WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('setting_edit.ejs', {setting: results[0]});
    }
  );
});

app.post('/setting/update/:id', (req, res) => {
  connection.query(
    'UPDATE setting SET content = ? WHERE id = ?',
    [req.body.newcontent, req.params.id],
    (error, results) => {
      res.redirect('/setting');
    }
  );
});

app.post('setting/edit')


app.listen(3000);