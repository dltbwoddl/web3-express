var express = require('express')
var router = express.Router()
var fs = require('fs');
var template = require('../lib/template.js');
var sanitizeHtml = require('sanitize-html');
var path = require('path');

router.get('/create', function (request, response) {
    var title = 'WEB - create';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
              <form action="/topic/create_process" method="post">
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
//Route Parameter
router.post('/create_process', function (request, response) {
    console.log(request.list);//undefined
    var post = request.body;
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.writeHead(302, { Location: `/topic/${title}` });
        response.end();
    })
    // });
})
router.post("/delete_process", function (request, response) {
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

router.get("/update/:pageid", function (request, response) {
    var filteredId = path.parse(request.params.pageid).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
        var title = request.params.pageid;
        var list = template.list(request.list);
        var html = template.HTML(title, list,
            `
              <form action="/topic/update_process" method="post">
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

router.post("/update_process", function (request, response) {
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
            response.redirect(`/topic/${title}`);
        })
        // });
    });
})

router.get('/:pageid', function (request, response, next) {
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
                ` <a href="/topic/create">create</a>
                      <a href="/topic/update/${sanitizedTitle}">update</a>
                      <form action="/topic/delete_process" method="post">
                        <input type="hidden" name="id" value="${sanitizedTitle}">
                        <input type="submit" value="delete">
                      </form>`
            );
            response.send(html)
        }
    });
});
module.exports=router;