var request = require("request");
var recorder = require("./recorder");
var jobpack = require("./common/jobpack");
var fs = require("graceful-fs");
var util = require("util");
var iconv = require('iconv-lite');

function spider(setting){
    if (!(this instanceof spider)) return new spider(setting);
    this.setting = setting;
}

spider.prototype.fetch = function(jobpack_json, callback){
    var params = jobpack_json.schema[jobpack_json.parser_name].params;
    var retry = typeof params.retry !== "undefined" ? params.retry : 3;
    var urls = jobpack_json.urls;
    for(var i = 0; i < urls.length; i++){
        var job = jobpack(jobpack_json);
        job.urls = [urls[i]];
        job.job_ids = [jobpack_json.job_ids[i]];
        this.crawler(job.tojson(), callback, retry);
    }
};

spider.prototype.crawler = function (jobpack_json, callback, retry){
    var $ = this;
    var setting = this.setting;
    var url = jobpack_json.urls[0];
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    var params = schema.params;
    var opts = this.build_req_opts(params);
    opts.url = url;
    //request
    var req = request(opts, function(e, r ,b) {
        var validerr = null;
        if(!e && //no call error or network error
            (r && r.statusCode === 200) && //stauts right
            !(validerr = $.validerr(params, b))){ //valid content
            //download page
            $.download(jobpack_json, b);
            //callback for parse
            callback(b, jobpack_json);
        }
        else{
            if(retry > 0){
                //retry
                $.crawler(jobpack_json, callback, retry - 1);
            }
            else{
                //no chance to retry, give up and report failed job
                if(e){ //has call error or network error
                    recorder(setting).failed(jobpack_json, util.inspect(e));
                }
                else if(!r || r.statusCode !== 200){ //status wrong
                    recorder(setting).failed(jobpack_json, !r ? "no response" : r.statusCode);
                }
                else{ //invalid content
                    recorder(setting).failed(jobpack_json, validerr);
                }
            }
        }
    });
};

spider.prototype.validerr = function (params, body) {
    try{
        eval("var validator = " + params.validator);
        if(!validator || validator(body)){
            return null;
        }
        else{
            return "invalid page";
        }
    }
    catch(err){
        return "invalid validator";
    }
};

spider.prototype.download = function (jobpack_json, b) {
    var setting = this.setting;
    var schema = jobpack_json.schema[jobpack_json.parser_name];
    var params = schema.params;
    var url = jobpack_json.urls[0];
    if(!(typeof params.download === 'undefined') && params.download){
        var task_dir = util.format("%s/%s", setting.data_path, jobpack_json.task_id);
        if(!fs.existsSync(task_dir)) {
            fs.mkdirSync(task_dir);
        }
        var download_dir = util.format("%s/%s", task_dir, jobpack_json.parser_name);
        if(!fs.existsSync(download_dir)) {
            fs.mkdirSync(download_dir);
        }
        var fname = util.format("%s/%s", download_dir, url.getfname());
        fs.writeFile(fname, b, function(err) {});
    }
};

spider.prototype.build_req_opts = function (params) {
    //build request opt
    var opt = {};
    this.setopt(opt, "qs", params.qs);
    this.setopt(opt, "method", params.method);
    this.setopt(opt, "body", params.body);
    this.setopt(opt, "headers", params.headers);
    this.setopt(opt, "form", params.form);
    this.setopt(opt, "auth", params.auth);
    this.setopt(opt, "json", params.json);
    this.setopt(opt, "encoding", params.encoding);
    this.setopt(opt, "followRedirect", params.followRedirect);
    this.setopt(opt, "followAllRedirects", params.followAllRedirects);
    this.setopt(opt, "maxRedirects", params.maxRedirects);
    this.setopt(opt, "pool", params.pool);
    this.setopt(opt, "pool.maxSockets", params['pool.maxSockets']);
    this.setopt(opt, "timeout", params.timeout);
    this.setopt(opt, "proxy", params.proxy);
    this.setopt(opt, "oauth", params.oauth);
    this.setopt(opt, "hawk", params.hawk);
    this.setopt(opt, "strictSSL", params.strictSSL);
    this.setopt(opt, "aws", params.aws);
    this.setopt(opt, "httpSignature", params.httpSignature);
    this.setopt(opt, "gzip", params.gzip);
    //encoding
    if(params.download){
        this.setopt(opt, "encoding", null);
    }
    //set 'Connection':'keep-alive'
    if(!opt.headers){
        opt.headers = {};
    }
    opt.headers['Connection'] = 'keep-alive';
    //change default maxRedirects, no redirection
    opt.maxRedirects = !opt.maxRedirects ? 0 : opt.maxRedirects;
    //set cookie
    if(params.cookie){
        var j = request.jar();
        var cookie = request.cookie(params.cookie);
        this.setopt(opt, "jar", params.cookie);
    }
    return opt;
};

spider.prototype.setopt = function(opt, key, val) {
    if(!(typeof val === "undefined")){
        opt[key] = val;
    }
    opt["agent"] = false;
};

module.exports = spider;

String.prototype.getfname = function() {
    return escape(this.replace(/[\/|\\]/g, ""));
}