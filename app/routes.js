var path = require('path');
const rp = require('request-promise');
const cheerio = require('cheerio');

var RecordList = require('./models/record');

var allUrls = Array();
var allUrlsHistory = Array();
var sessionId = null;

module.exports = function (app, io) {

    // Home Page
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/../public/views/index.html'));
    });

    // Handle Client response
    io.on('connection', function (client) {
        console.log('New Client connected..');

        client.on('join', function (dt) {
            if (dt) {
                // process.exit();
            }
        });

        client.on('parse', function (url) {

            console.log("URL to parse: " + url);

            allUrls = [];
            allUrlsHistory = [];
            if (url[url.length - 1] === '/') {
                url = url.substring(0, url.length - 1)
            }
            allUrls.push(url);
            allUrlsHistory.push(url);
            sessionId = Math.random().toString(36).substring(7);
            parseAsync(client, function () {
                client.emit('parseDone', 'Operation Completed Successfully');
            });

        });

    });

    function getDomainByURL(url) {
        if (url.indexOf('http') >= 0) {
            url = url.split('//')[1];
            url = url.split('/')[0];
        }
        return url;
    }

    function insertUnique(url, client, cb) {

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
                            list: [url]
                        });
                        recordList.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            cb(url);
                        });
                    } else {
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
            }
        );

    }

    function parseAsync(client, cb) {

        if (allUrls.length == 0) {
            client.emit('total_url_queued', 0);
            cb();
            return;
        }

        client.emit('total_url_queued', allUrls.length);

        var url = allUrls.pop();

        insertUnique(url, client, function (url) {

            client.emit('latest_url', url);

            const options = {
                uri: url,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };

            currentDomainName = getDomainByURL(url);

            rp(options)
                .then(($) => {
                    client.emit('total_url_parsed', true);
                    $('a').each(function (i, elem) {
                        var q = elem.attribs.href;
                        if (q && q != "") {
                            if (q.indexOf('http') <= -1 && q.indexOf('www') <= -1) {
                                // Relative Urls
                            } else {

                                if (currentDomainName === getDomainByURL(q)) {

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
                    parseAsync(client, cb);
                })
                .catch((err) => {
                    client.emit('total_url_parsed', true);
                    console.log("Error URL: " + url);
                    parseAsync(client, cb);
                });
        });

    }

};