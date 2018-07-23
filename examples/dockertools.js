const ex = require('../app/data/docker-tools.js');
function stop() {
  ex.stopService("testDaemon", (err, data) => {
    if (err) {
      console.log("ERROR")
      console.log(err)
    } else {
      console.log("Stopped")
    }
  })
}

function  run() {
  ex.runService("alpine", "testDaemon",{detached:true,  interactive: true}, (err, data) => {
    if (err) {
      console.log("ERROR")
      console.log(err)
    }
    else {
      console.log("RUNNING")
    }
  });
}
function  start() {
  ex.startService("testDaemon", (err, data) => {
    if (err) {
      console.log("ERROR")
      console.log(err)
    } else {
      console.log("Start")
    }
  })
}

function createAttach() {
  ex.startService("testDaemon", (err, data) => {
    if (err) {
      console.log("ERROR")
      console.log(err)
    } else {
      console.log("Start")
      ex.attachServiceToNetwork("testDaemon", "bypassthefirewall_internal_network", (err2, data2) => {
        if (err2) {
          console.log("ERROR CREATE NETWORK")
          console.log(err2)
        } else {
          console.log("CREATED DATA")
          console.log(data2)
        }
      })
    }
  })
}

function disconnect() {
  ex.detachServiceToNetwork("testDaemon", "bypassthefirewall_internal_network", (err, data) => {
    if (err) {
      console.log("ERROR CREATE NETWORK");
      console.log(err);
    } else {
      console.log("DETACHED");
    }

  });
}

function getInfoContainer() {
  ex.getInfoContainer("bypassthefirewall_router_1", (err, data) => {
    if (err) {
      console.log("ERR");
      console.log(err);
    } else {
      console.log("INFO");
      console.log(data);
    }
  })
}
function getPS() {

  ex.getServices((err, data) => {
    if (err) {
      callback(err);
    } else {
      console.log("SUCCESS");
      console.log(data);
    }
  })
}

function getNetworkLab() {
  ex.getNetworksLab("bruteforceme", (err, data) => {
    if (err) {
      console.log("ERROR");
      console.log(err);
    } else {
      console.log(data);
    }
  });
}


function getFreeAddress() {
  ex.getFreeAddress("bruteforceme_default", (err, data) => {
    if (err) {
      console.log("ERROR");
    } else {
      console.log("success");
      console.log(data);
    }
  });
}

// getPS();
// disconnect()
// createAttach()
// run()
getNetworkLab();
// getFreeAddress();
