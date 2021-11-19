const axios = require("axios");
const cheerio = require("cheerio");


const getHtml = async (url) => {
  try {
    return await axios.get(url);
  } catch (error) {
    console.error(error);
  }
};

const newsUrl = 'http://www.hkbs.co.kr/';
const newsCrawling = getHtml(newsUrl)
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


const weatherUrl = 'https://weather.naver.com/today/09140104';
const weatherCrawling = getHtml(weatherUrl)
  .then(html => {
    let weatherList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("div.today_weather");
    $bodyList.each(function (i, elem) {
      weatherList[i] = {
        temp: $(this).find('div.weather_area strong').text(),
        summary: $(this).find('div.weather_area p.summary span.weather').text(),
        summary_hum: $(this).find('div.weather_area dl.summary_list dt.term').eq(0).text(),
        humidity: $(this).find('div.weather_area dl.summary_list dd.desc').eq(0).text(),
        summary_win: $(this).find('div.weather_area dl.summary_list dt.term').eq(1).text(),
        wind: $(this).find('div.weather_area dl.summary_list dd.desc').eq(1).text(),
        summary_sen: $(this).find('div.weather_area dl.summary_list dt.term').eq(2).text(),
        sense: $(this).find('div.weather_area dl.summary_list dd.desc').eq(2).text(),
        fine_dust: $(this).find('ul.today_chart_list li.item_today em').eq(0).text(),
        ultra_fine_dust: $(this).find('ul.today_chart_list li.item_today em').eq(1).text(),
        uv_rays: $(this).find('ul.today_chart_list li.item_today em').eq(2).text(),
        // level: $(this).find('ul.today_chart_list li.item_today em').first().text(),
      };
    });
    return weatherList;
  })

module.exports = { newsCrawling, weatherCrawling };