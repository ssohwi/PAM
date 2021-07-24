var Crawler = require("crawler");

var crawler = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      console.log($("title").text());

      const $bodyList = $("ul.news_list").children("li.news_item");

      let newsList = [];
      $bodyList.each(function (i, elem) {
        newsList[i] = {
          title: $(this).find('div.info_area strong').text(),
          url: $(this).find('a.link').attr('href'),
          image_url: $(this).find('div.thumb_area img').attr('src'),
          image_alt: $(this).find('div.thumb_area img').attr('alt'),
          // summary: $(this).find('p.lead').text().slice(0, -11),
          // date: $(this).find('span.p-time').text()
        };
      });

      console.log(newsList);
    }
    done();
  }
});

// Queue just one URL, with default callback
c.queue('https://weather.naver.com/');