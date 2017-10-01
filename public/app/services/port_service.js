function dsp_portService() {

var constraintsProto =  { 
min : 10000,
max : 65536,
notAllowed : []
}
this.min, this.max
this.allPorts = []
//List of ports not allowed in min-max range

this.init = function init(constraints) {  
 	var c = _.extend({}, constraintsProto, constraints) 
this.min = c.min
this.max = c.max
//Init values
this.notAllowed = c.notAllowed
this.freePorts = []
this.usedPorts = []
this.notAllowedPorts = []

for (i = 1; i <= 10; i++) 
	this.allPorts.push(i)

//fill data
for(i = 0; i<=(this.max-this.min); i++) 
	if(this.notAllowed.indexOf(i+this.min) === -1)
		this.freePorts.push(i+this.min)
}

function shift(arr_one, arr_two, p) {
	var i = arr_one.indexOf(p)
	if(i === -1) throw new Error("Not found in used ports")
	arr_one.splice(i, 1)
	arr_two.push(p) 
}
this.usePort = function(p) {
	shift(this.freePorts, this.usedPorts, p)	
}
this.freePort = function(p) {
	shift(this.usedPorts, this.freePorts, p)	
}

}
