var express = require("express");
var router = express.Router();

const fs = require("fs");

// eslint-disable-next-line no-undef
let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.includes(".js") && route !== "index.js") {
    try {
      const routeModule = require("./" + route);
      router.use("/" + route.replace(".js", ""), routeModule);
    } catch (error) {
      console.error(`Error in route ${route}:`, error);
    }
  }
}

module.exports = router;
