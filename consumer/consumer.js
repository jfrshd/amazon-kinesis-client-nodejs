var kcl = require("aws-kcl");
var logger = require("./logger");
var util = require("util");
const AWS = require("aws-sdk");

const cloudwatchlogs = new AWS.CloudWatchLogs({ region: "eu-west-1" });
function recordProcessor() {
  var log = logger().getLogger("recordProcessor");
  var shardId;

  return {
    initialize: function (initializeInput, completeCallback) {
      shardId = initializeInput.shardId;
      completeCallback();
    },

    processRecords: function (processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) {
        completeCallback();
        return;
      }

      // var connection = new WebSocket("ws://127.0.0.1:1337").client;

      // connection.onerror = function (error) {
      //   console.log("error", error);
      // };

      // connection.onopen = function () {};

      var records = processRecordsInput.records;
      var record, data, sequenceNumber, partitionKey;

      // console.log(
      //   JSON.parse(Buffer.from(records[0].data, "base64").toString())
      // );
      // completeCallback();
      // return;
      cloudwatchlogs.describeLogStreams(
        {
          logGroupName: "kcl",
        },
        (err, data) => {
          if (err) {
            console.log(err);
            return;
          }

          var params = {
            logEvents: records.map((record, index) => {
              record = JSON.parse(
                Buffer.from(record.data, "base64").toString()
              );
              // console.log(record);
              return {
                message: JSON.stringify({
                  sub: record.eventBody.sub,
                  uuid: record.eventBody.uuid,
                  // date_created: record.eventBody.date_created,
                  date_created: Date.now(),
                }),
                timestamp: Date.now(),
              };
            }),
            logGroupName: "kcl",
            logStreamName: "kcl",
            sequenceToken: data.logStreams[0].uploadSequenceToken,
          };
          cloudwatchlogs.putLogEvents(params, function (err, data) {
            if (err) console.log("cloudwatch", err, err.stack);
            else {
              // console.log("cloudwatch", data);
            }
          });
        }
      );

      // for (var i = 0; i < records.length; ++i) {
      //   record = records[i];
      //   data = Buffer.from(record.data, "base64").toString();
      //   sequenceNumber = record.sequenceNumber;
      //   partitionKey = record.partitionKey;
      //   // log.info(
      //   //   util.format(
      //   //     "ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s",
      //   //     shardId,
      //   //     data,
      //   //     sequenceNumber,
      //   //     partitionKey
      //   //   )
      //   // );
      //   log.info(util.format(data));

      //   // connection.send(data);
      // }
      if (!sequenceNumber) {
        completeCallback();
        return;
      }
      // If checkpointing, completeCallback should only be called once checkpoint is complete.
      processRecordsInput.checkpointer.checkpoint(
        sequenceNumber,
        function (err, sequenceNumber) {
          // log.info(
          //   util.format(
          //     "Checkpoint successful. ShardID: %s, SeqenceNumber: %s",
          //     shardId,
          //     sequenceNumber
          //   )
          // );
          completeCallback();
        }
      );
    },
    shutdown: function (shutdownInput, completeCallback) {
      // Your shutdown logic.

      if (shutdownInput.reason !== "TERMINATE") {
        completeCallback();
        return;
      }
      shutdownInput.checkpointer.checkpoint(function (err) {
        // Error handling logic.
        // Invoke the callback at the end to mark the shutdown
        // operation complete.
        completeCallback();
      });
    },
  };
}
kcl(recordProcessor()).run();

// 1612957577714509503

// 1612957578865498005

// 1612957586083952700

// 1612957586126003627

// (1612957586126003627 - 1612957577714509503) / 1000000000

// (1612957586083952700 - 1612957578865498005 )/ 1000000000
