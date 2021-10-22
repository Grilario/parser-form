import fs from "fs";

async function ChunkExtractor(tpmFile, boundary) {
  const file = fs.readFileSync(tpmFile);

  const form = Buffer.from(file)
    .slice(boundary.length + 4, -(boundary.length + 6))
    .toString()
    .split("--" + boundary + "\r\n")
    .map((input) => {
      const [info, content] = input.split("\r\n\r\n").map((value, i) => {
        if (i === 1) {
          return value.slice(0, -2);
        }
        return value;
      });
      if (info.includes("filename")) {
        const fileinfo = {};
        info.split("\r\n").map((value, i) => {
          if (i === 0) {
            value
              .slice(32)
              .split("; ")
              .map((value, i) => {
                if (i === 0) {
                  fileinfo.inputName = value.split("=")[1].slice(1, -1);
                  return;
                }
                fileinfo.filename = value.split("=")[1].slice(1, -1);
              });
            return;
          }
          fileinfo.mimetype = value.slice(14);
        });
        return { ...fileinfo, buffer: Buffer.from(content) };
      }
      return {
        inputName: info.slice(38, -1),
        content,
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
