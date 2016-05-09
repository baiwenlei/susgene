var fs = require('fs');
var express = require('express');
var bodyparser = require('body-parser');
var multer = require('multer');

var upload = multer({ dest: 'uploads/', limits:{fileSize:5*1024*1024}});

var app = express();
var Profile = require('./profile');
var indexCalc = require('./calc');

var handlebars = require('express-handlebars').create({
    defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
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

        var profiles = [];
        var parseErr = [];
        var article = data.toString();
        var lines = article.split(/[\r\n]+/);
        lines.forEach((line, i, array) => {
            var profile = line && Profile.createFromString(line);
            profile && profiles.push(profile);
        });

        profiles && indexCalc(profiles);

        res.locals.profiles = profiles;
        res.render('result', {
            helpers: {
                tablerow: function(profile) {
                    var str = '<tr><td>';
                    str += profile.toArray().join('</td><td>');
                    str += '</td></tr>'

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
