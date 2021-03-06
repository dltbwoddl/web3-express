const express = require('express');
const app = express();
const port = 3000;
var fs = require('fs');
var url = require('url');
var bodyParser = require('body-parser');
var compression = require('compression');

var template = require('./lib/template.js');
var sanitizeHtml = require('sanitize-html');
var path = require('path');
var qs = require('querystring');

//미들웨어= 남이 만들어놓은 도구 사용하는 것.
//공통적으로 사용되는 것 함수로 묶어 미들웨어로 만들기.
//이 코드들이 실행될때 마다 bodyparser가 생성됨.
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

//미들웨어 실행 순서
//

//use대신 get으로 하면 get으로 들어오는 모든 접근에 대해서만 실행한다
//때문에 process같이 post로 들어오는 곳에서는 실행되지 않는다.
app.get('*', function (request, response, next) {
  fs.readdir('./data', function (error, filelist) {
    request.list = filelist;
    next();//다음에 호출될 미들웨어 
  });
});
//주소에 쿼리스트링 빼는 것이 대세.
// /를 통해 표현해보기.
app.get('/', function (request, response) {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}
      <img src='/images/hello.jfif' style='width:300px; display:block; margin-top:10ox'>`,
    `<a href="/create">create</a>`
  );
  response.send(html);
});

//Route Parameter
app.get('/page/:pageid', function (request, response,next) {
  var filteredId = path.parse(request.params.pageid).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    if (err) {
      next(err)
      //인자가 4개인 미들웨어로 이동한다.
    } else {
      var title = request.params.pageid;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(request.list);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
                    <a href="/update/${sanitizedTitle}">update</a>
                    <form action="delete_process" method="post">
                      <input type="hidden" name="id" value="${sanitizedTitle}">
                      <input type="submit" value="delete">
                    </form>`
      );
      response.send(html)
    }
  });
});

app.get('/create', function (request, response) {
    var title = 'WEB - create';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
              <form action="/create_process" method="post">
                <p><input type="text" name="title" placeholder="title"></p>
                <p>
                  <textarea name="description" placeholder="description"></textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
            `, '');
    response.send(html);
})


app.post('/create_process', function (request, response) {
console.log(request.list);//undefined
      var post = request.body;
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.writeHead(302, { Location: `/page/${title}` });
        response.end();
      })
    // });
})

app.get("/update/:pageid", function (request, response) {
    var filteredId = path.parse(request.params.pageid).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = request.params.pageid;
      var list = template.list(request.list);
      var html = template.HTML(title, list,
        `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
        `<a href="/create">create</a> <a href="/update/${title}">update</a>`
      );
      response.send(html);
    });
})
app.post("/update_process", function (request, response) {
  // console.log(100)
  // var body = '';
  // request.on('data', function (data) {
  //   body = body + data;
  // });
  // request.on('end', function () {
    var post = request.body;
    var id = post.id;
    var title = post.title;
    var description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function (error) {
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.redirect(`/page/${title}`);
      })
    // });
  });
})

app.post("/page/delete_process", function (request, response) {
  // var body = '';
  // request.on('data', function (data) {
  //   body = body + data;
  // });
  // request.on('end', function () {
    var post = request.body;
    var id = post.id;
    var filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function (error) {
      response.redirect("/");
    })
  // });
})

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



// var http = require('http');
// var fs = require('fs');
// var url = require('url');
// var qs = require('querystring');
// var template = require('./lib/template.js');
// var path = require('path');
// var sanitizeHtml = require('sanitize-html');

// var app = http.createServer(function(request,response){
//     var _url = request.url;
//     var queryData = url.parse(_url, true).query;
//     var pathname = url.parse(_url, true).pathname;
//     if(pathname === '/'){
//       if(queryData.id === undefined){
//         
//       } else {
//         fs.readdir('./data', function(error, filelist){
//           var filteredId = path.parse(queryData.id).base;
//           fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
//             var title = queryData.id;
//             var sanitizedTitle = sanitizeHtml(title);
//             var sanitizedDescription = sanitizeHtml(description, {
//               allowedTags:['h1']
//             });
//             var list = template.list(filelist);
//             var html = template.HTML(sanitizedTitle, list,
//               `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
//               ` <a href="/create">create</a>
//                 <a href="/update?id=${sanitizedTitle}">update</a>
//                 <form action="delete_process" method="post">
//                   <input type="hidden" name="id" value="${sanitizedTitle}">
//                   <input type="submit" value="delete">
//                 </form>`
//             );
//             response.writeHead(200);
//             response.end(html);
//           });
//         });
//       }
//     } else if(pathname === '/create'){
//       fs.readdir('./data', function(error, filelist){
//         var title = 'WEB - create';
//         var list = template.list(filelist);
//         var html = template.HTML(title, list, `
//           <form action="/create_process" method="post">
//             <p><input type="text" name="title" placeholder="title"></p>
//             <p>
//               <textarea name="description" placeholder="description"></textarea>
//             </p>
//             <p>
//               <input type="submit">
//             </p>
//           </form>
//         `, '');
//         response.writeHead(200);
//         response.end(html);
//       });
//     } else if(pathname === '/create_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var title = post.title;
//           var description = post.description;
//           fs.writeFile(`data/${title}`, description, 'utf8', function(err){
//             response.writeHead(302, {Location: `/?id=${title}`});
//             response.end();
//           })
//       });
//     } else if(pathname === '/update'){
//       fs.readdir('./data', function(error, filelist){
//         var filteredId = path.parse(queryData.id).base;
//         fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
//           var title = queryData.id;
//           var list = template.list(filelist);
//           var html = template.HTML(title, list,
//             `
//             <form action="/update_process" method="post">
//               <input type="hidden" name="id" value="${title}">
//               <p><input type="text" name="title" placeholder="title" value="${title}"></p>
//               <p>
//                 <textarea name="description" placeholder="description">${description}</textarea>
//               </p>
//               <p>
//                 <input type="submit">
//               </p>
//             </form>
//             `,
//             `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
//           );
//           response.writeHead(200);
//           response.end(html);
//         });
//       });
//     } else if(pathname === '/update_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var id = post.id;
//           var title = post.title;
//           var description = post.description;
//           fs.rename(`data/${id}`, `data/${title}`, function(error){
//             fs.writeFile(`data/${title}`, description, 'utf8', function(err){
//               response.writeHead(302, {Location: `/?id=${title}`});
//               response.end();
//             })
//           });
//       });
//     } else if(pathname === '/delete_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var id = post.id;
//           var filteredId = path.parse(id).base;
//           fs.unlink(`data/${filteredId}`, function(error){
//             response.writeHead(302, {Location: `/`});
//             response.end();
//           })
//       });
//     } else {
//       response.writeHead(404);
//       response.end('Not found');
//     }
// });
// app.listen(3000)
