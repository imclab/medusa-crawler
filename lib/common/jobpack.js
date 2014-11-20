var uuid = require('uuid');

function jobpack(jobpack_json)
{
    if (!(this instanceof jobpack)) return new jobpack(jobpack_json);
    this.task_id = typeof jobpack_json.task_id === 'undefined'? uuid.v4() : jobpack_json.task_id;
    if(typeof jobpack_json.job_ids === 'undefined'){
        job_ids = [];
        for(var i = 0; i < jobpack_json.urls.length; i++){
            job_ids.push(uuid.v4());
        }
        this.job_ids = job_ids;
    }
    else{
        this.job_ids = jobpack_json.job_ids;
    }
    this.urls = jobpack_json.urls;
    this.schema_id = jobpack_json.schema_id;
    this.schema = jobpack_json.schema;
    this.parser_name = jobpack_json.parser_name;
}

jobpack.prototype.tojson = function () {
    return {
        task_id : this.task_id,
        job_ids : this.job_ids,
        urls : this.urls,
        schema_id : this.schema_id,
        schema : this.schema,
        parser_name : this.parser_name
    };
};

jobpack.prototype.split = function(num) {
    if(num <= 0){
        return [];
    }
    if(this.urls.length < num){
        num = this.urls.length
    }
    var ret = [];
    var step = Math.floor(this.urls.length / num);
    for(var i = 0; i < num; i++){
        var l = i * step;
        var r = (i === num - 1) ? this.urls.length : (i + 1) * step;
        ret.push(jobpack({
            task_id : this.task_id,
            job_ids : this.job_ids.slice(l, r),
            urls : this.urls.slice(l, r),
            schema_id : this.schema_id,
            schema : this.schema,
            parser_name : this.parser_name
        }));
    }
    return ret;
};

module.exports = jobpack;