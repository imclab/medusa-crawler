var event = require("./common/event");
var logger = require("./common/logger");
var reactor = require("./reactor");
var express = require('express');

function medusa(setting){
    if (!(this instanceof medusa)) return new medusa(setting);
    var http_server = require('http').createServer(express());

    //reactor
    var r = reactor(setting);
    //register event handler
    this.io = require('socket.io')(http_server);
    this.io.sockets.on("connection", function(socket){
        //on new job event
        socket.on(event.job, function(jobpack){
            r.on_jobpack(jobpack, socket);
        });
        //
    });
//listen at port
    http_server.listen(setting.server.port, function () {
        logger(setting).notice("HTTP server listening at port[%d]", setting.server.port);
    });
}

module.exports = medusa;