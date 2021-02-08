var kcl = require("aws-kcl");
var logger = require("./logger");
var util = require("util");

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
      for (var i = 0; i < records.length; ++i) {
        record = records[i];
        data = new Buffer(record.data, "base64").toString();
        sequenceNumber = record.sequenceNumber;
        partitionKey = record.partitionKey;
        // log.info(
        //   util.format(
        //     "ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s",
        //     shardId,
        //     data,
        //     sequenceNumber,
        //     partitionKey
        //   )
        // );
        log.info(util.format(JSON.parse(data)));

        // connection.send(data);
      }
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
