var util = require("util");
var fs = require("graceful-fs");
var jobpack = require("../common/jobpack");

function parser(setting){
    if (!(this instanceof parser)) return new parser(setting);
    this.setting = setting;
}

parser.prototype.parse = function(page, jobpack_json){};

parser.prototype.parse_emiter = function(jobpack_json){};

parser.prototype.parse_infields = function(page, jobpack_json){};

parser.prototype.parse_raw = function(schema, ret){};

parser.prototype.parse_trans = function(schema, ret){
    var name = schema.name;
    var trans = schema.trans;
    if(typeof trans === "undefined"){
        return;
    }
    for(var i = 0; i < name.length; i++){
        var cols = ret[name[i]];
        var tran = trans[i];
        for(var j = 0; j < cols.length; j++){
            var c = eval(tran);
            cols[j] = c(cols[j]);
        }
    }
};

parser.prototype.parse_outfields = function(infields, jobpack_json){
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    var setting = this.setting;
    //
    if(typeof schema.outfields === "undefined"){
        return;
    }
    //check if infileds has equal col
    var nrow = -1;
    for(item in infields){
        if(nrow != -1 && nrow != infields[item].length)
        {
            throw  "page parse error: outfiled has inconsistent length";
        }
        nrow = infields[item].length;
    }
    if(nrow === -1){
        return;
    }
    //write output
    var buffer = "";
    for(var i = 0; i < nrow; i++){
        var line = [];
        for(var j = 0; j < schema.outfields.length; j++){
            var filed = [];
            for(var k = 0; k < schema.outfields[j].length; k++){
                var infiled = schema.outfields[j][k];
                filed.push(infields[infiled][i]);
            }
            filed = filed.join("$$");
            line.push(filed);
        }
        buffer += line.join("\t") + "\n";
    }
    var task_dir = util.format("%s/%s", setting.data_path, jobpack_json.task_id);
    if(!fs.existsSync(task_dir)){
        fs.mkdirSync(task_dir);
    }
    var fname = util.format("%s/%s.out", task_dir, jobpack_json.parser_name);
    fs.appendFile(fname, buffer, function(err) {
        if(err){
          throw util.format("failed to write out file[%s]", fname);
        }
    });
};

parser.prototype.parse_url = function(trans_callback, params){
    //check if params has equal col
    var nrow = -1;
    for(item in params){
        if(nrow != -1 && nrow != params[item].length)
        {
            return [];
        }
        nrow = params[item].length;
    }
    if(nrow === -1){
        return [];
    }
    var ret_urls = [];
    var ncol = params;
    for(var i = 0; i < nrow; i++){
        var fun_params = [];
        for(name in params){
            fun_params.push(params[name][i]);
        }
        var urls = trans_callback.apply(trans_callback, fun_params);
        if(urls instanceof Array){
            ret_urls = ret_urls.concat(urls);
        }
        else{
            ret_urls.push(urls);
        }
    }
    return ret_urls;
};

parser.prototype.parse_emiter = function(jobpack_json){
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    var ret = [];
    if(typeof schema.emiter === "undefined"){
        return ret;
    }
    for(var i = 0; i < schema.emiter.length; i++){
        var emiter = schema.emiter[i];
        var params = {};
        this.parse_raw(emiter, params);
        var urls = [];
        if(typeof emiter.trans === 'undefined'){
            for(var item in params){
                urls = urls.concat(params[item]);
            }
        }
        else{
            for(var j = 0; j < emiter.trans.length; j++){
                eval("var trans = " + emiter.trans[j] + ";");
                urls = urls.concat(this.parse_url(trans, params));
            }
        }

        var pack = jobpack({
            task_id : jobpack_json.task_id,
            urls : urls,
            schema_id : jobpack_json.schema_id,
            schema : jobpack_json.schema,
            parser_name : emiter.parser_name
        });
        ret.push(pack);
    }
    return ret;
};

module.exports = parser;
