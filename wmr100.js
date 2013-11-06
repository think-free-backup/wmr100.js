/* Imports */

var restify = require('restify');
var spawn = require('child_process').spawn;

/* Main data structure */

var dataStructure = new Object();
        dataStructure.temp = new Array();

/* Start wmr100 and process data to datastructure */

var prc = spawn('./wmr100',  ['-s']);
prc.stdout.setEncoding('utf8');

prc.stdout.on('data', function (data) {

    var str = data.toString()
    var line = str.split('\n')[1];

    try{

        var json = JSON.parse(line);
        console.log(json.topic + JSON.stringify(json));
        processJson(json);
    }
    catch(err){console.log(err)}
});

prc.on('close', function (code) {

    prc = spawn('./wmr100',  ['-s']);
});

/* Server json with restify */

var server = restify.createServer();
server.get('/', function(req, res, next){

    res.send({type :"ok", body : "server alive"});
});

server.get('/api/current/summary', function(req, res, next){

        generateJson(function (json){

                res.send({
                        type: "data",
                        body:json
                });
        })

});

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

/* Helper functions */

function processJson(json){

        if (json.topic === "temp"){

                dataStructure.temp[json.sensor] = json;
        }
        else{

                dataStructure[json.topic] = json;
        }
}

function generateJson(callback){

        var output = new Object();
        output.date = new Date();
        output.pressure = dataStructure.pressure.pressure;
        output.forecast = dataStructure.pressure.forecast;
        output.rain_rate = dataStructure.rain.rate;
        output.rain_hour_total = dataStructure.rain.hour_total;
        output.rain_day_total = dataStructure.rain.day_total;
        output.rain_all_total = dataStructure.rain.all_total;
        output.wind_dir = dataStructure.wind.dir;
        output.wind_speed = dataStructure.wind.speed;
        output.wind_avg_speed = dataStructure.wind.avgspeed;

        output.temperature = new Array();
        output.humidity = new Array();
        output.dewpoint = new Array();
        output.smiley = new Array();
        output.trend = new Array();

        for(var idx in dataStructure.temp){

                var tmp = dataStructure.temp[idx];

                output.temperature.push({sensor : tmp.sensor, value: tmp.temp});
                output.humidity.push({sensor : tmp.sensor, value: tmp.humidity});
                output.dewpoint.push({sensor : tmp.sensor, value: tmp.dewpoint});
                output.smiley.push({sensor : tmp.sensor, value: tmp.smile});
                output.trend.push({sensor : tmp.sensor, value: tmp.trend});
        }

        callback(output);
}
