var fs = require('fs');
var express = require('express');
var bodyparser = require('body-parser');
var multer = require('multer');
var jStat = require('jStat').jStat;

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
    var paramConfig = bodyToConfig(req.body);

    var file = req.file.path;
    fs.readFile(file, (err, data) => {
        if (err) {
            return next(err);
        }

        try {
            var profile = new Profile();
            profile.loadFromString(data.toString());

            var result = compute(profile, paramConfig);

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
        } catch(err) {
            next(err);
        }
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

function bodyToConfig(body) {
    var target=[], generation=[], mat=[];
    for(var key in body) {
        var parts = key.split('-');
        var i = parseInt(parts[1]);
        var val = parseFloat(body[key]);

        switch (parts[0]) {
            case "target":
                target[i] = val;
                break;

            case "gen":
                generation[i] = val;
                break;

            case "m":
                var j = parseInt(parts[2]);
                mat[i] = (mat[i] || []);
                mat[i][j] = val;
                break;
            default:
                // console.error();
                break;
        }
    }

    var config = {
        mat : jStat(mat),
        goal: target,
        generation: generation
    };

    // console.log(config);

    return config;
}
