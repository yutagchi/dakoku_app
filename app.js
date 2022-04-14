const express = require('express');

const app = express();

  let nowTime = new Date();
  let nowHour = nowTime.getHours();
  let nowMin  = nowTime.getMinutes();
  let nowSec  = nowTime.getSeconds();
  let now = nowHour + ":" + nowMin + ":" + nowSec;

app.get('/', (req, res) => {
  res.render('hello.ejs',{timeStamp: now});
});

app.listen(3000);