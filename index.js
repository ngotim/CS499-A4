var request = require('request');
var parseString = require('xml2js').parseString;
var express = require('express')
var uuid = require('uuid/v1');
var elasticsearch = require('elasticsearch');



var client = new elasticsearch.Client({
    host: 'search-cs499a4-utgechbh7gsxzcsg5gonutnntq.us-west-1.es.amazonaws.com',
    log: 'info'
});

var healthCheck = function () {
    client.ping({
        requestTimeout: 5000
    }, function (error) {
        if (error) {
            console.trace('Elasticsearch cluster is down!');
        } else {
            console.log('All is well');
        }
    });
}

var uploadToElastic = function (items) {
    for (var i = 0; i < items.length; ++i) {
        client.create({
            index: 'cs',
            type: 'waitTime',
            id: uuid(),
            body: items[i]
        }, function (error, response) {
            if (error) {
                console.error(error);
            }
        });
    }
    console.log("Upload finished");
};

function fetchWaitingtimes() {
    request('http://www.universalstudioshollywood.com/waittimes/?type=all&site=USH', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var upload = [];
            parseString(body, function (err, result) {
                var items = result.rss.channel[0].item;
                for (var i = 0; i < items.length; ++i) {
                    var ride = JSON.stringify(items[i].description[0]);
                    if (items[i].title[0] !== 'Last updated' && ride.match(/[APap][mM]/)) {
                        upload.push({
                            'time': Date.now(),
                            'title': items[i].title[0],
                            'waittime': items[i].description[0]
                        });
                    }
                }
            });
            uploadToElastic(upload);
        }
    })
}

var wait = 600000 // Every 10 mins
var waitTimer = function () {
    setInterval(function () {
        fetchWaitingtimes();
    }, wait)
};

var healthTimer = function () {
    setInterval(function () {
        healthCheck();
    }, wait)
};
