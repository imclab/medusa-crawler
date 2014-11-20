var logger = require("./common/logger");
var util = require("util");
var fs = require("graceful-fs");

function recorder(setting){
    if (!(this instanceof recorder)) return new recorder(setting);
    this.setting = setting;
}

recorder.prototype.success = function(jobpack_json) {
    var fname = util.format("%s/%s.log", this.setting.monitor_path, jobpack_json.task_id);
    logger(this.setting).log(fname, "notice", {
        schema_id : jobpack_json.schema_id,
        parser_name : jobpack_json.parser_name,
        urls :jobpack_json.urls,
        job_ids : jobpack_json.job_ids,
        state : "success"
    });
};

recorder.prototype.emit = function(jobpack_json) {
    var fname = util.format("%s/%s.log", this.setting.monitor_path, jobpack_json.task_id);
    logger(this.setting).log(fname, "notice", {
        schema_id : jobpack_json.schema_id,
        parser_name : jobpack_json.parser_name,
        urls :jobpack_json.urls,
        job_ids : jobpack_json.job_ids,
        state : "emit"
    });
};

recorder.prototype.failed = function(jobpack_json, reason) {
    var fname = util.format("%s/%s.log", this.setting.monitor_path, jobpack_json.task_id);
    logger(this.setting).log(fname, "notice", {
        schema_id : jobpack_json.schema_id,
        parser_name : jobpack_json.parser_name,
        urls :jobpack_json.urls,
        job_ids : jobpack_json.job_ids,
        state : "failed",
        reason : reason
    });
};

recorder.prototype.recved = function(jobpack_json) {
    var fname = util.format("%s/%s.log", this.setting.monitor_path, jobpack_json.task_id);
    logger(this.setting).log(fname, "notice", {
        schema_id : jobpack_json.schema_id,
        parser_name : jobpack_json.parser_name,
        urls :jobpack_json.urls,
        job_ids : jobpack_json.job_ids,
        state : "recved"
    });
};

module.exports = recorder;