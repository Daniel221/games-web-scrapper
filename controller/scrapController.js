const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const { text } = require("cheerio/lib/api/manipulation");

const URL =
  "https://store.steampowered.com/search/?sort_by=&sort_order=0&filter=topsellers&page=1";

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const headers = [
  {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua":
      '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  },
  {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.5",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent":
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0",
  },
];

class scrapController {
  MAX_VISITS = 3;
  visited = new Set();
  toVisit = new Set();

  proxy = {
    protocol: "http",
    host: "80.48.119.28",
    port: 80,
  };

  constructor() {
    this.toVisit.add(URL);
  }

  async _readTestFile() {
    return await fs.readFile("data/test-data.txt", "binary");
  }

  extractLinks = ($) => [
    ...new Set(
      $("div.search_pagination_right a") // Select pagination links
        .map((_, a) => $(a).attr("href")) // Extract the href (url) from each link
        .toArray() // Convert cheerio object to array
    ),
  ];

  extractGameContent = ($) =>
    $("#search_resultsRows a")
      .map((_, a) => {
        const $product = $(a);
        return {
          id: $product.attr("data-ds-appid"),
          img: $product.find("img").attr("src"),
          title: $product.find(".title").text(),
          price: $product.find(".search_price").text().replace(" ", ""),
          discount: $product.find(".search_discount").text().replace(" ", ""),
          relaseDate: $product.find(".search_released").text(),
        };
      })
      .toArray();

  async crawler(url) {
    this.visited.add(url);
    const { data } = await axios.get(url, { headers: sample(headers) });
    const $ = cheerio.load(data);
    const links = [URL, ...this.extractLinks($)];
    const games = this.extractGameContent($);
    links
      .filter((link) => !this.visited.has(link))
      .forEach((link) => this.toVisit.add(link));

    return games;
  }

  async scrap() {
    let gamesInfo = [];

    for (const next of this.toVisit.values()) {
      if (this.visited.size >= this.MAX_VISITS) {
        break;
      }
      this.toVisit.delete(next);
      gamesInfo.push({
        games: await this.crawler(next),
        page: this.visited.size,
      });
    }
    return gamesInfo;
  }
}

module.exports = scrapController;
