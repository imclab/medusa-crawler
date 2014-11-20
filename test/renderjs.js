var phantom = require('phantom');

phantom.create(function (ph) {
    ph.createPage(function (page) {
        page.open("http://www.zhiboxia.com/", function (status) {
            console.log("opened baidu? ", status);
            page.evaluate(function () {
                return document.all['0'].outerHTML;
            }, function (page) {
                console.log(page);
                ph.exit();
            });
        });
    });
}, {
    parameters: {
        'load-images' : false,
        'ignore-ssl-errors': true
    },
    dnodeOpts: {
        weak: false
    }
});