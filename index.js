import http from "http";
import fs from "fs";
import { FormData } from "./parser.js";

const port = process.env.PORT || 3333;

try {
  fs.mkdirSync("./tmp");
  fs.mkdirSync("./files");
} catch (err) {}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    const file = await FormData(req);
    fs.writeFileSync("./files/" + file[1].filename, file[1].buffer);
    res.write(`<a href="/file/${file[1].filename}">Baixar arquivo</a>`);
    res.end();
    return;
  }
  if (req.method === "GET") {
    if (req.url.includes("/file/")) {
      const filename = decodeURIComponent(req.url).slice(6);
      if (fs.existsSync("./files/" + filename)) {
        const file = fs.createReadStream("./files/" + filename);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        file.on("data", (chunk) => {
          res.write(chunk);
        });
        file.on("end", () => {
          file.close();
          res.end();
        });
        return;
      }
      res.write(fs.readFileSync("./html/notfound.html"));
      res.end();
      return;
    }
    res.write(fs.readFileSync("./html/index.html"));
    res.end();
  }
});

server.listen(port, () => {
  console.log("Running...");
});
