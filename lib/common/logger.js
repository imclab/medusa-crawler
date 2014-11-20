var fs = require("graceful-fs");
var settings = require('../../test/setting');
var util = require("util");

function logger(setting){
    if (!(this instanceof logger)) return new logger(setting);

    this.setting = setting;
    if(!(typeof setting === 'undefined'))
    {
        this.fname = setting.log.notice_path;
        this.wfname = setting.log.wf_path;
    }
}

logger.prototype.log = function (fname, level, format){
    var levels = ["fetal", "error", "warn", "notice"];
    if(levels.indexOf(level) >= levels.indexOf(this.setting.log_level)){
        if (typeof format !== 'string'){
            message = JSON.stringify(format);
        }
        else{
            var args = Array.prototype.slice.call(arguments).slice(2);
            message = util.format.apply(util, args);
        }
        message = level + "::" +
                  (new Date()).format("yyyy-MM-dd hh:mm:ss") + "::" +
                  message +
                  "\n";
        fs.appendFile(fname, message, function(err) {
            if(err){
                throw err;
            }
        });
    }
};

logger.prototype.notice = function(format) {
    var args = [this.fname, "notice"].concat(Array.prototype.slice.call(arguments));
    this.log.apply(this, args);
};
logger.prototype.warn = function(format) {
    var args = [this.wfname, "warn"].concat(Array.prototype.slice.call(arguments));
    this.log.apply(this, args);
};
logger.prototype.error = function(format) {
    var args = [this.wfname, "error"].concat(Array.prototype.slice.call(arguments));
    this.log.apply(this, args);
};
logger.prototype.fetal = function(format) {
    var args = [this.wfname, "fetal"].concat(Array.prototype.slice.call(arguments));
    this.log.apply(this, args);
};

module.exports = logger;

//datetime format function
Date.prototype.format = function(format){
    var o = {
        "M+" : this.getMonth() + 1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    };

    if(/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o) {
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        }
    }
    return format;
}