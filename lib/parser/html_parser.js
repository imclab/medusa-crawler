var cheerio = require('cheerio');
var util = require("util");
var parser = require("./parser");

function html_parser(setting){
    if (!(this instanceof html_parser)) return new html_parser(setting);
    this.setting = setting;
}

util.inherits(html_parser, parser);

html_parser.prototype.parse = function(page, jobpack_json){
    this.$ = cheerio.load(page);
    var infields = this.parse_infields(page, jobpack_json);
    this.parse_outfields(infields, jobpack_json);
};

html_parser.prototype.parse_infields = function(page, jobpack_json){
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    if(typeof schema.infields === "undefined"){
        return {};
    }
    var infields = {};
    for(var i = 0; i < schema.infields.length; i++){
        this.parse_raw(schema.infields[i], infields);
        this.parse_extend(schema.infields[i], infields);
        this.parse_group(schema.infields[i], infields);
        this.parse_trans(schema.infields[i], infields);
    }
    return infields;
};

html_parser.prototype.parse_raw = function(schema, ret){
    var $ = this.$;
    var name = schema.name;
    var selector = schema.selector;
    var foreach = schema.foreach;
    for(var i = 0; i < foreach.length; i++){
        (function(index){
            ret[name[index]] = [];
            eval(selector).each(function(idx, elem){
                var cmd = util.format("$(elem).%s", foreach[index]);
                ret[name[index]].push(eval(cmd).trim());
            });
        })(i);
    }
};

html_parser.prototype.parse_extend = function(schema, ret){
    var $ = this.$;
    var name = schema.name;
    var extend = schema.extend;
    if(typeof extend === 'undefined'){
        return;
    }
    var repeat = [];
    var groups = eval(util.format("$('%s')", extend.group));
    for(var i = 0; i < groups.length; i++) {
        var cmd = util.format("$(groups[i]).find('%s').length", extend.group_item);
        repeat.push(eval(cmd))
    }
    for(var i = 0; i < name.length; i++){
        var n = name[i];
        var cols = [];
        for(var j = 0; j < repeat.length; j++){
            for(var k = 0; k < repeat[j]; k++){
                cols.push(ret[n][j]);
            }
        }
        ret[n] = cols;
    }
};

html_parser.prototype.parse_group = function(schema, ret){
    var $ = this.$;
    var name = schema.name;
    var group = schema.group;
    if(typeof group === 'undefined'){
        return;
    }
    var repeat = [];
    var groups = eval(util.format("$('%s')", group.group));
    for(var i = 0; i < groups.length; i++) {
        var cmd = util.format("$(groups[i]).find('%s').length", group.group_item);
        repeat.push(eval(cmd))
    }
    for(var i = 0; i < name.length; i++){
        var base = 0;
        var n = name[i];
        var cols = [];
        for(var j = 0; j < repeat.length; j++){
            var g = [];
            for(var k = 0; k < repeat[j]; k++){
                g.push(ret[n][base++]);
            }
            cols.push(g.join("$$"));
        }
        ret[n] = cols;
    }
};

module.exports = html_parser;

//
String.prototype.trim = function(){
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
};