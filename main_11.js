const express = require('express');
const app = express();
const port = 3000;
var fs = require('fs');
var bodyParser = require('body-parser');
var compression = require('compression');
var topicRouter=require('./routes/topic')
var template = require('./lib/template.js');


//미들웨어= 남이 만들어놓은 도구 사용하는 것.
//공통적으로 사용되는 것 함수로 묶어 미들웨어로 만들기.
//이 코드들이 실행될때 마다 bodyparser가 생성됨.
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.get('*', function (request, response, next) {
  fs.readdir('./data', function (error, filelist) {
    request.list = filelist;
    next();
  });
});

app.use('/topic',topicRouter)


app.get('/', function (request, response) {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}
      <img src='/images/hello.jfif' style='width:300px; display:block; margin-top:10ox'>`,
    `<a href="/topic/create">create</a>`
  );
  response.send(html);
});



//페이지 에러 코드를 뒤에 두는 이유는 미들웨어는 순서대로
//실행되기 때문에 마지막까지 찾지 못했을 때 나오도록 하기 위해
app.use(function(req, res, next) {
  console.log(4000)
  res.status(404).send("페이지를 찾지 못했습니다");
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
