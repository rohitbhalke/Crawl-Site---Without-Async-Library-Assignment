var http = require("http");
var cheerio = require('cheerio');
var fs = require('fs');
var json2csv = require('json2csv');
var request = require('request');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var eventEmitter = new EventEmitter();



var site = 'https://medium.com/', result = [], limit, call= 0, allTags = [], intermediateResult = [], END = false;
limit = process.argv[2] ? parseInt(process.argv[2].split("=")[1]) : 2;

http.createServer(function (req, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Hello World\n');
}).listen(4000);


result.push(site);
allTags.push(site);

var hitSite = function() {
    var url = result[0];
    result.splice(0,1);
    if(url){
        request(url, function (err, response, html) {
            var $, anchorTagsObjArray, anchorTags = [], filteredTags;
            if(html){
                $ = cheerio.load(html);
                anchorTagsObjArray = $('a'), anchorTags = [];

                [].forEach.call(anchorTagsObjArray, function (url) {
                    anchorTags.push(url.attribs.href);
                });
                filteredTags = removeUnnecessaryTags(anchorTags);
                [].push.apply(allTags, filteredTags);
                [].push.apply(intermediateResult, filteredTags);
                //console.log(url, filteredTags.length, result.length);
                END = false;
            }
            hitSite();
        });
    }
    else{
        if(call===limit){
            if(eventEmitter.emit)
                eventEmitter.emit("done");
            eventEmitter = {};
        }
        else if(call<limit && !END){
            END = true;
            result = uniqueTags(intermediateResult);
            intermediateResult = [];
            for(var i=0;i<reqLimit;i++){
                hitSite(limit);
            }
            call++;
            //console.log("I AM DONE");
        }
    }
};


eventEmitter.on('done', function(){
    allTags = uniqueTags(allTags);
    //console.log("Inside Event Emitter");
    writeFile();
});


var firstHit = function() {
    var url = result[0];
    result.splice(0,1);
    if(url){
        request(url, function (err, response, html) {
            var $, anchorTagsObjArray, anchorTags = [], filteredTags;

            $ = cheerio.load(html);
            anchorTagsObjArray = $('a'), anchorTags = [];

            [].forEach.call(anchorTagsObjArray, function (url) {
                anchorTags.push(url.attribs.href);
            });
            filteredTags = removeUnnecessaryTags(anchorTags);
            [].push.apply(result, filteredTags);
            //console.log(url, filteredTags.length);

            sendConcurrentRequests(5);

            function sendConcurrentRequests(reqLimit) {

                for(var i=0;i<reqLimit;i++){
                    hitSite(limit);
                }
                call++;
                //while(call<limit){
                //    call++;
                //    hitSite();
                //}
            }
        });
    }
};



call++;
firstHit(site);


var writeFile = function(){
    var json = convertToJson(allTags);
    var csv = json2csv({data: json, fields: ['url']});
    fs.writeFile('file.csv', csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
};

var convertToJson = function (arr) {
    var objArr = [];
    arr.forEach(function (index) {
        objArr.push(
            {
                'url': index
            }
        )
    });
    return objArr;
};

var uniqueTags = function (arrayOfTags) {
    // The purpose is to get unique tags from array
    var unique = arrayOfTags.filter(function (tagUrl) {
        return tagUrl && arrayOfTags.indexOf(tagUrl) === arrayOfTags.lastIndexOf(tagUrl);
    });
    return unique;
};

var removeUnnecessaryTags = function (arrayOfTags) {
    // The purpose is to filter out only those urls which belongs to medium.com
    var mediumSiteTags = arrayOfTags.filter(function (tagUrl) {
        return tagUrl.indexOf('https://medium.com/') === 0 || tagUrl === 'https://jobs.medium.com' || tagUrl === 'https://legal.medium.com';
    });
    return uniqueTags(mediumSiteTags);
};


console.log('Starting Crawling');