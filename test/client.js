var fs = require("graceful-fs");
var setting = require("./setting");
var jobpack = require("../lib/common/jobpack");
var event = require("../lib/common/event");
var util = require("util");

var host = util.format("http://%s:%d", "127.0.0.1", setting.server.port);
var socket = require('socket.io-client')(host);
var schema = fs.readFileSync(__dirname + '/schema/caoliu', 'utf-8');
schema = schema.replace(/\s+\.\.\.\s+/g, "");
schema = JSON.parse(schema);
var pack = jobpack({
    urls : ["http://www.zlvc.net/thread0806.php?fid=16&search=&page=5"],
    schema_id : 1,
    schema : schema,
    parser_name : "list"
});
socket.on('connect', function(){
    console.log("conneted to server");
    socket.emit(event.job, pack.tojson());
});