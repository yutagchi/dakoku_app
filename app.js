const express = require('express');

const app = express();

app.get('/', (req, res) => {
  let nowTime = new Date();
  let nowHour = nowTime.getHours();
  let nowMin  = nowTime.getMinutes();
  let nowSec  = nowTime.getSeconds();
  let now = nowHour + ":" + nowMin + ":" + nowSec;
  res.render('hello.ejs',{now: now});
});

app.listen(3000);