exports.server = {
    port: 2014
};

exports.peer = [
    {
        host : "127.0.0.1",
        port : 2014
    }
 ];

exports.log = {
    level : "notice",
    notice_path : __dirname + "/log/medusa.log",
    wf_path : __dirname  + "/log/medusa.log.wf"
};

exports.monitor_path = __dirname + "/monitor/";

exports.data_path = __dirname + "/data/";