const axios = require("axios");
const cheerio = require("cheerio");

const url = 'http://www.hkbs.co.kr/';

const getHtml = async (url) => {
  try {
    return await axios.get(url);
  } catch (error) {
    console.error(error);
  }
};

const crawling = getHtml(url)
  .then(html => {
    let ulList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("div#skin-12").children("div.item");
    $bodyList.each(function (i, elem) {
      ulList[i] = {
        title: $(this).find('span.content strong').text(),
        url: $(this).find('a').attr('href'),
        image_url: $(this).find('em.auto-images').attr('style').slice(21, -1),
      };
    });
    return ulList.filter(n => n.title);
  })

var ts = "https://api.thingspeak.com/channels/1396062/feeds.json?api_key=Z08R8XG4ODAGPNH8&results=2";



module.exports = { crawling };