const readline = require("readline");
const fs = require("fs");

const readInterface = readline.createInterface({
  input: fs.createReadStream("./application.log"),
  output: process.stdout,
  console: false,
});

uuids = {};

readInterface.on("line", function (line) {
  const record = JSON.parse(line);
  uuids[record.uuid] =
    uuids[record.uuid] === undefined
      ? [record]
      : [...uuids[record.uuid], record];
});

readInterface.on("close", () => {
  console.log(uuids);

  Object.keys(uuids).forEach((key) => {
    uuids[key].sort((a, b) => (a.date_created > b.date_created ? -1 : 1));
    console.log(
      (uuids[key][0].date_created -
        uuids[key][uuids[key].length - 1].date_created) /
        1000000000
    );
  });
});
