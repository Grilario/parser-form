import http from "http";
import fs from "fs";
import { FormData } from "./parser.js";

try {
  fs.mkdirSync("./tmp");
} catch (err) {}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    console.log(await FormData(req));
  }
  res.write(fs.readFileSync("./index.html"));
  res.end();
});

server.listen("3333", "0.0.0.0", () => {
  console.log("Runnig");
});
