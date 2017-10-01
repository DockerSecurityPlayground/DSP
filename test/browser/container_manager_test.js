var expect = chai.expect


describe("Container Manager Test", function() 
{
		beforeEach(function(finito)  {

			this.containerManager = dsp_ContainerManagerService()
			finito() 	
		})

		it("Service should exists", function() 
		{
			expect(this.containerManager).not.be.undefined
		})
		
		it( " Lists should exists ", function() 
		{
			expect(this.containerManager.containerListNotDrawed).not.be.undefined
			expect(this.containerManager.containerListDrawed).not.be.undefined
		})
		it("New element test", function() 
		{
			var clnd = this.containerManager.containerListNotDrawed 
			var obj = {name: "TEST", prova:"PROVA"}
			this.containerManager.addToNotDrawed(obj)
			expect(this.containerManager.sizeNotDrawed()).to.be.eql(1)	

		})
		it("remove test",  function(){
			var obj = {name: "TEST", prova:"PROVA"}
			var obj2 = {name: "TEST2", prova:"PROVA2"}
			var obj3 = {name: "TEST3", prova:"PROVA3"}

			this.containerManager.addToNotDrawed(obj)
			this.containerManager.addToNotDrawed(obj2)
			this.containerManager.addToNotDrawed(obj3)
			
			this.containerManager.deleteFromNotDrawed("TEST") 
			expect(this.containerManager.sizeNotDrawed()).to.be.eql(2)	
		}) 
		it("updateWhenNotDrawed test",  function() {
			var obj = {name: "TEST", prova:"PROVA"}
			var obj2 = {name: "TEST2", prova:"PROVA2"}
			var obj3 = {name: "TEST3", prova:"PROVA3"}

			var clnd = this.containerManager.containerListNotDrawed  
			var cld = this.containerManager.containerListDrawed 
		
			this.containerManager.addToNotDrawed(obj)
			this.containerManager.addToNotDrawed(obj2)
			this.containerManager.addToNotDrawed(obj3)
			this.containerManager.updateWhenDrawed("TEST")
			expect(this.containerManager.sizeNotDrawed()).to.be.eql(2)		
			expect(this.containerManager.sizeDrawed()).to.be.eql(1)		


		}) 
		it("updateWhenDrawed test",  function(){

			var obj = {name: "TEST", prova:"PROVA"}
			var obj2 = {name: "TEST2", prova:"PROVA2"}
			var obj3 = {name: "TEST3", prova:"PROVA3"}

			var clnd = this.containerManager.containerListNotDrawed  
			var cld = this.containerManager.containerListDrawed 
		
			this.containerManager.addToDrawed(obj)
			this.containerManager.addToDrawed(obj2)
			this.containerManager.addToDrawed(obj3)
			this.containerManager.updateWhenNotDrawed("TEST")
			this.containerManager.updateWhenNotDrawed("TEST2")
			expect(this.containerManager.sizeNotDrawed()).to.be.eql(2)		
			expect(this.containerManager.sizeDrawed()).to.be.eql(1)		

		}) 	

		it("Update when shouldn't destroy element properties", function(){
			
			var obj = {name: "TEST", prova:"PROVA"}
			var obj2 = {name: "TEST2", prova:"PROVA2"}
			var obj3 = {name: "TEST3", prova:"PROVA3"}

			var clnd = this.containerManager.containerListNotDrawed  
			var cld = this.containerManager.containerListDrawed 
		
			this.containerManager.addToNotDrawed(obj)
			this.containerManager.addToNotDrawed(obj2)
			this.containerManager.addToNotDrawed(obj3)
			this.containerManager.updateWhenDrawed("TEST")
			expect(_.where(cld,{name:"TEST"})[0].prova).not.to.be.undefined
		})
})
