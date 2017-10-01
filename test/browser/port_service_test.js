
var expect = chai.expect


describe("Port service", function() {

	beforeEach(function() { 
		this.obj = dsp_portService()
		this.obj.init()
		console.log("dsp port service:")
		console.log(this.obj)
	})
	it("should use port" , function() {
			this.obj.usePort(10001)	
			expect(_.contains(this.obj.freePorts, 10001)).not.to.be.ok
			expect(_.contains(this.obj.usedPorts, 10001)).to.be.ok
	})
	it("should free port" , function() {

			this.obj.usePort(10001)	
			expect(_.contains(this.obj.freePorts, 10001)).not.to.be.ok
			expect(_.contains(this.obj.usedPorts, 10001)).to.be.ok
			this.obj.freePort(10001)	
			expect(_.contains(this.obj.freePorts, 10001)).to.be.ok
			expect(_.contains(this.obj.usedPorts, 10001)).not.to.be.ok
	})
	it("Should not to contain a not allowed port" , function() {
		this.obj.init({notAllowed:[11000,10020]})
		expect(_.contains(this.obj.freePorts, 10020)).not.to.be.ok
		expect(_.contains(this.obj.freePorts, 11000)).not.to.be.ok
	})


}) 
