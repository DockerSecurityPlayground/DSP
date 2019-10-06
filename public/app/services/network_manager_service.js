function dsp_networkManagerService() {

  var networkPrototype = {
    name : "" ,
    subnet : "",
    color : "black"
  },

    // { nameNetwork : { subnet, color, subnetSet } }
    networkList =  []

  //			function contains(address) {
  //				var subnet = address.substring(0,address.lastIndexOf("."))+".1"
  //				console.log(subnet)
  //				//find network
  //				var obj = _.where(networkList, {subnet: subnet }
  //				if(obj === undefined) return true
  //
  //
  //				}


  return {
    //true if has subnet
    hasSubnet(subnet) {
      return !_.isEmpty(_.where(networkList, {
        subnet: subnet}))
    } ,
    hasNetwork(name) {
      try {
        this.getNetwork(name)
        return true
      }

      catch(err) {
        return false
      }
    } ,
    subnetOf(address) {
      return address.substring(0, address.lastIndexOf("."))+".1"
    },
    getNetworks() {
      return networkList
    },
    getNetworkBySubnet(subnet) {
      var ret =  _.filter(networkList, function(n) {
        return n.subnet === subnet
      })

      if(_.isEmpty(ret)) throw new Error("Network doesn't exists")
      return    ret[0]


    },
    getNetwork(name) {
      var ret =  _.filter(networkList, function(n) {
        return n.name === name
      })

      if(_.isEmpty(ret)) throw new Error("Network doesn't exists")
      return    ret[0]
    },

    getFirst(name) {
      var network = _.where(networkList, {name:name})[0]

      if(!network)
        return ""
      else
        return network.listIP[0]

    },
    genList(subnet) {
      var s =  subnet.substring(0,subnet.length-2)
      var i = 1
      var listIP = []
      for( i = 2; i <= 255; i++)
        listIP[i-2]=s+"."+i
      return listIP;
    },
    //n : {name , subnet, color }
    newNetwork(n) {
      var obj = 	_.create(networkPrototype, n)
      obj.listIP = []
      var s =  obj.subnet.substring(0,obj.subnet.length-2)
      var i = 1
      // dynamic   => 0
      // 192.1.1.2 => 1
      // 192.1.1.3 => 2
      // ...
      for( i = 2; i <= 255; i++)
        obj.listIP[i-2]=s+"."+i

      networkList.push(obj)
      return obj
    },



    removeNetwork(name) {
      //					console.log("in net service: ")
      //					console.log("before:")
      //					console.log(networkList)
      networkList = _.filter(networkList, function(n) {
        return n.name !== name
      })
      //					console.log("after:")
      //					console.log(networkList)
    },
    hasAddress(address) {
      var ret = false
      //If find address ret = true
      _.each(networkList,function(a) {
        if(_.contains( a.listIP, address))
        {
          ret = true
          return
        }
      })
      return ret
    },
    setNetworkList(nl) {
      networkList = nl
    },
    useAddress(address) {
      //Get subnet
      var subnet = this.subnetOf(address)
      //Find subnet object
      var ret =  _.filter(networkList, function(n) {
        return n.subnet === subnet
      })
      //Remove from there
      if(!_.isEmpty(ret))
        ret[0].listIP= _.without(ret[0].listIP, address)


    },
    freeAddress(address) {
      var ret = _.filter(networkList, function(n) {
        return n.subnet ===  this.subnetOf(address)
      }.bind(this))
      //Remove from there
      if(!_.isEmpty(ret))
      {
        ret[0].listIP.push(address)
        //Order
        ret[0].listIP =ret[0].listIP.sort(function(a,b){
          //get a last cipher
          var a_number = parseInt(a.substring(a.lastIndexOf(".")+1, a.length) )

          var b_number = parseInt(b.substring(a.lastIndexOf(".")+1, b.length) )

          return a_number - b_number
        })
      }

    },
    parseYaml(yamlFile) {
      const networks = yamlFile.networks;
      _.each(networks, function(network, id) {
        var subnet = network.ipam.config[0].subnet;

      });
    }
  }
}
