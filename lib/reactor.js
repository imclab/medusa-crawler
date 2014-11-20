var logger = require("./common/logger");
var recorder = require("./recorder");
var spider = require("./spider");
var html_parser = require("./parser/html_parser");
var json_parser = require("./parser/json_parser");
var launcher = require("./launcher");
var util = require('util');

function reactor(setting){
    if (!(this instanceof reactor)) return new reactor(setting);
    this.setting = setting;
    this.rocket = launcher(setting);
}

reactor.prototype.on_jobpack = function(jobpack_json, socket){
    var setting = this.setting;
    var rocket = this.rocket;
    recorder(setting).recved(jobpack_json);

    spider(this.setting).fetch(jobpack_json, function (page, jobpack_json){
        var params = jobpack_json.schema[jobpack_json.parser_name].params;
        var parser;
        if(params.tpage === "html" || typeof params.tpage === "undefined"){
            parser = html_parser(setting);
        }
        else if(params.tpage === "json"){
            parser = json_parser(setting);
        }
        else{
            recorder(setting).failed(jobpack_json, util.format("unknown page type[%s]", params.tpage));
            return;
        }
        try{
            parser.parse(page, jobpack_json);
            var jobpacks = parser.parse_emiter(jobpack_json);
            rocket.emit(jobpacks);
            recorder(setting).success(jobpack_json);
        }
        catch(err){
            recorder(setting).failed(jobpack_json, util.inspect(err));
        }
    });

};

module.exports = reactor;