var util = require("util");
var parser = require("./parser");

function json_parser(setting){
    if (!(this instanceof json_parser)) return new json_parser(setting);
    this.setting = setting;
}

util.inherits(json_parser, parser);

json_parser.prototype.parse = function(page, jobpack_json){
    eval("this.$ = " + page + ";");
    var infields = this.parse_infields(page, jobpack_json);
    this.parse_outfields(infields, jobpack_json);
};

json_parser.prototype.parse_infields = function(page, jobpack_json){
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    if(typeof schema.infields === "undefined"){
        return {};
    }
    var infields = {};
    for(var i = 0; i < schema.infields.length; i++){
        this.parse_raw(schema.infields[i], infields);
        this.parse_trans(schema.infields[i], infields);
    }
    return infields;
};

json_parser.prototype.parse_raw = function(schema, ret){
    var $ = this.$;
    var name = schema.name;
    var selector = schema.selector;
    var context = eval("$" + selector);
    var foreach = schema.foreach;
    if(typeof foreach === "undefined"){ //cell
        ret[name[0]] = [context];
        return;
    }
    if(context instanceof Array){ //table
        for(var i = 0; i < foreach.length; i++){
            (function(index){
                ret[name[index]] = [];
                for(var j = 0; j < context.length; j++){
                    ret[name[index]].push(eval("context[j]" + foreach[index]));
                }
            })(i);
        }
    }
    else{ //line
        for(var i = 0; i < foreach.length; i++){
            (function(index){
                ret[name[index]] = [eval("context" + foreach[index])];
            })(i);
        }
    }
};

module.exports = json_parser;

//
String.prototype.trim = function(){
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
};