const express = require("express");
const scrapController = require("./controller/ScrapController");
const app = express();
const fs = require("fs").promises; //me permite manejar los arhivos como promesas, en lugar de callbacks
const port = 3000;
const ScrapController = new scrapController();

app.get("/", async (req, res) => {
  const data = await ScrapController.scrap();
  res.send(data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app;
