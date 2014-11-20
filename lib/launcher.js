var con = require('socket.io-client');
var util = require('util');
var logger = require('./common/logger');
var event = require("./common/event");

function launcher(setting)
{
    if (!(this instanceof launcher)) return new launcher(setting);
    this.setting = setting;
    var socks = this.socks = [];
    for(var i = 0; i < setting.peer.length; i++){
        (function(index){
            var peer = setting.peer[i];
            var host = util.format("http://%s:%d", peer.host, peer.port);
            var socket = con(host, {'force new connection': true});
            socket.on('disconnect', function(){
                //TODO:reconnect
            });
            socks.push(socket);
        })(i);
    }
}

launcher.prototype.emit = function(jobpacks){
    var setting = this.setting;
    for(var k = 0; k < jobpacks.length; k++){
        var pack_arry = jobpacks[k].split(setting.peer.length);
        if(pack_arry.length < setting.peer.length){
            //randomly
            setting.peer.shuffle();
        }
        for(var i = 0; i < pack_arry.length; i++) {
            var sock = this.socks[i];
            sock.emit(event.job, pack_arry[i].tojson());
        }
    }
};

module.exports = launcher;

//
Array.prototype.shuffle = function(){
    for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};