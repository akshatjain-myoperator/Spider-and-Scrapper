var path = require('path');
const rp = require('request-promise');
const cheerio = require('cheerio');

var RecordList = require('./models/record');

var allUrls = Array();
var allUrlsHistory = Array();
var sessionId = null;

module.exports = function (app) {

    // Home Page
    app.get('/', function (req, res) {
        // Return static home page file
        res.sendFile(path.join(__dirname + '/../public/views/index.html'));
    });

    function getDomainByURL(url) {
        if (url.indexOf('http') >= 0) {
            url = url.split('//')[1];
            url = url.split('/')[0];
        }
        return url;
    }

    function insertUnique(url, cb) {

        console.log('insertUnique');

        RecordList.findOne({
                sessionId: sessionId
            },
            function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (!doc) {
                        var recordList = new RecordList({
                            sessionId: sessionId,
                            list: []
                        });
                        recordList.save(function (err) {
                            if (err) {
                                throw err;
                            }
                        });
                    }

                    RecordList.findOneAndUpdate({
                            sessionId: sessionId
                        }, {
                            "$push": {
                                "list": url
                            }
                        },
                        function (err, doc) {
                            if (err) {
                                throw err;
                            }
                            cb(url);
                        }
                    );

                }
            }
        );

    }

    function parseAsync(cb) {

        console.log("allUrls.length: " + allUrls.length);
        if (allUrls.length == 0) {
            // All queries complete
            cb();
            return;
        }

        var url = allUrls.pop();

        insertUnique(url, function (url) {
            const options = {
                uri: url,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };

            console.log(url);
            currentDomainName = getDomainByURL(url);

            rp(options)
                .then(($) => {
                    $('a').each(function (i, elem) {
                        var q = elem.attribs.href;
                        if (q && q != "") {
                            if (q.indexOf('http') <= -1 && q.indexOf('www') <= -1) {
                                // Relative Urls
                            } else {
                                // Absolute Urls

                                if (currentDomainName === getDomainByURL(q)) {
                                    // URLs on same domain

                                    if (q[q.length - 1] === '/') {
                                        q = q.substring(0, q.length - 1)
                                    }

                                    if (allUrlsHistory.indexOf(q) <= -1) {
                                        allUrls.push(q);
                                        allUrlsHistory.push(q);
                                    }
                                }

                            }
                        }
                    });
                    parseAsync(cb);
                })
                .catch((err) => {
                    console.log("Error URL: " + url);
                    // console.log(err);
                    parseAsync(cb);
                });
        });

    }

    // Home Page
    app.get('/parse', function (req, res) {

        console.log("URL: " + req.query.url);

        allUrls = [];
        allUrlsHistory = [];
        allUrls.push(req.query.url);
        allUrlsHistory.push(req.query.url);
        sessionId = Math.random().toString(36).substring(7);
        parseAsync(function () {
            res.json('Done');
        });

    });

};