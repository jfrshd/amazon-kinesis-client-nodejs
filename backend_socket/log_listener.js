var WebSocketClient = require("websocket").client;

var spawn = require("child_process").spawn;
var tail = spawn("tail", [
  "-f",
  "../consumer/application.log",
]);

var client = new WebSocketClient();

client.on("connectFailed", function (error) {
  console.log("Connect Error: " + error.toString());
});

client.on("connect", function (connection) {
  console.log("WebSocket Client Connected");

  connection.on("error", function (error) {
    console.log("Connection Error: " + error.toString());
  });
  connection.on("close", function () {
    console.log("echo-protocol Connection Closed");
  });

  tail.stdout.on("data", (data) => {
    const tmp = data.toString();
    if (tmp !== undefined) {
      console.log(JSON.stringify(tmp));
      connection.send(JSON.stringify(tmp));
    } else console.log("undefined");
  });
});

client.connect("ws://127.0.0.1:1337/");
