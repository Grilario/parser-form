import fs from "fs";

async function ChunkExtractor(tpmFile, boundary) {
  const file = fs.readFileSync(tpmFile);
  const form = file
    .slice(boundary.length + 4, -(boundary.length + 8))
    .toString("hex")
    .split(Buffer.from("--" + boundary + "\r\n").toString("hex"))
    .map((input) => {
      let info,
        content,
        fileInfo = {};

      if (Buffer.from(input, "hex").toString().includes("filename")) {
        [info, content] = input.split("0d0a0d0a");
        Buffer.from(info, "hex")
          .toString()
          .split("\r\n")
          .map((value, i) => {
            if (i === 0) {
              value
                .slice(32)
                .split("; ")
                .map((value, i) => {
                  if (i === 0) {
                    fileInfo.input = value.split("=")[1].slice(1, -1);
                    return;
                  }
                  fileInfo.filename = value.split("=")[1].slice(1, -1);
                });
              return;
            }
            fileInfo.mimetype = value.slice(14);
          });
        return {
          ...fileInfo,
          buffer: Buffer.from(content, "hex"),
        };
      }
      [info, content] = input.slice(0, -4).split("0d0a0d0a");
      return {
        input: Buffer.from(info, "hex").toString().slice(38, -1),
        value: Buffer.from(content, "hex").toString(),
      };
    });

  fs.unlinkSync(tpmFile);
  return form;
}

async function FormData(req) {
  if (req.method === "POST") {
    const contentLength = req.headers["content-length"];
    if (contentLength > 52428800) return { err: "Limit size exceeded" };

    const types = req.headers["content-type"].split(";");
    if (types[0] === "multipart/form-data") {
      const boundary = types[1].split("=")[1];

      const tmpFile =
        "./tmp/" + Math.random().toString(36).substr(2, 9) + ".file";
      const data = fs.createWriteStream(tmpFile, { encoding: "base64" });
      req.on("data", (chunk) => {
        data.write(chunk);
      });
      const fileInfo = await new Promise((resolve, resject) => {
        req.on("end", () => {
          data.end(async () => {
            resolve(await ChunkExtractor(tmpFile, boundary));
          });
        });
      });

      return fileInfo;
    } else return { err: "Form not suported" };
  } else {
    return { err: "Resquest method invalid" };
  }
}

export { FormData };
