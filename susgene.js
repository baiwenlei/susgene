var fs = require('fs');
var express = require('express');
var bodyparser = require('body-parser');
var multer = require('multer');

var upload = multer({ dest: 'uploads/', limits:{fileSize:5*1024*1024}});

var app = express();
var Profile = require('./profile');
var compute = require('./compute');

var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    extname: '.hbs'
});
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', __dirname+'/views');
app.set('port', process.env.port||3000);

app.use(express.static(__dirname+'/public'));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(upload.single('input-file'));

app.post('/', function(req, res, next) {
    var file = req.file.path;
    fs.readFile(file, (err, data) => {
        if (err) {
            throw err;
        }

        var profile = new Profile();
        profile.loadFromString(data.toString());

        var result = compute(profile);

        res.locals.names = profile.colums[0];
        res.locals.index1 = result[0];
        res.locals.index2 = result[1];
        res.render('result', {
            helpers: {
                result_table: function(names, index1, index2) {
                    var str = "";

                     names.forEach((name, i) => {
                        str += '<tr>';
                        str += '<td>' + (i+1) + '</td>';
                        str += '<td>' + name + '</td>';
                        str += '<td>' + index1[i] + '</td>';
                        str += '<td>' + index2[i] + '</td>';
                        str += '</tr>'
                    });

                    return str;
                }
            }
        });


        fs.unlink(file, err => {});
    });
});

app.use(function(req, res, next) {
    res.sendFile(__dirname+'/public/404.html');
});

app.use(function(err, req, res, next) {
    debugger;
    res.type('text/plain');
    res.status(500);
    res.send('500 - Internal Error\n' + err.message);
});

app.listen(app.get('port'), function() {
    console.log('Express server stated on http://localhost:'+app.get('port')+';');
});
