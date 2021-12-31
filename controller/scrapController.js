const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const {
  text
} = require('cheerio/lib/api/manipulation');

const URL = 'https://store.steampowered.com/search/?sort_by=&sort_order=0&filter=topsellers&page=1';

class scrapController {
  MAX_VISITS = 3;
  visited = new Set();
  toVisit = new Set();

  constructor() {
    this.toVisit.add(URL);
  }

  async _readTestFile() {
    return await fs.readFile('data/test-data.txt', 'binary');
  }

  extractLinks = ($) => [
    ...new Set(
      $('div.search_pagination_right a') // Select pagination links 
      .map((_, a) => $(a).attr('href')) // Extract the href (url) from each link 
      .toArray() // Convert cheerio object to array 
    ),
  ];

  extractGameContent = $ =>
    $('#search_resultsRows a')
    .map((_, a) => {
      const $product = $(a);
      return {
        id: $product.attr('data-ds-appid'),
        img: $product.find('img').attr('src'),
        title: $product.find('.title').text(),
        price: $product.find('.search_price').text().replace(" ",""),
        discount: $product.find('.search_discount').text().replace(" ", ""),
        relaseDate: $product.find('.search_released').text(),
      };
    })
    .toArray();

  async crawler(url) {
    this.visited.add(url);
    const {
      data
    } = await axios.get(url);
    const $ = cheerio.load(data);
    const links = [URL, ...this.extractLinks($)];
    const games = this.extractGameContent($);
    links
      .filter(link => !this.visited.has(link))
      .forEach(link => this.toVisit.add(link));

    return games;
  }

  async scrap() {
    let games = [];
    let i = 1;
    for (const next of this.toVisit.values()) {
      if (this.visited.size >= this.MAX_VISITS) {
        break;
      }
      this.toVisit.delete(next);
      games.push({
        games: await this.crawler(next),
        page: i,
      });

      i++;
    }
    return games; 
  }
}

module.exports = scrapController;