var expect = require('chai').expect
var db = require("../app/data/db.js") ,
	async = require('async')
var LabelDB = require("../app/data/labels.js") 


describe("LabelDB" , function() {
		before(function(done) {
		/**
		 * Initialise the server and start listening when we're ready!
		 */
		db.init( (err, results) => {
		    if (err) {
			console.error("** FATAL ERROR ON STARTUP: ");
			console.error(err);
			process.exit(-1);
		    }

			this.db = db;
			done()
			
		});

		})



	
		it("Should create a new label" , function(done) {
			

	
			var stubLabel = { name: "label_test", description: "description of label_test", color: "red" } 
			LabelDB.getLabels(function(err,data) { 
		
					if(data && data.length !== 0) 
					{ 	
						LabelDB.deleteLabel(stubLabel.name)
						testSelect()
					}
					else 
					{
						testSelect() 
					}
			}) 
			function testSelect() {

				LabelDB.createLabel(stubLabel, function(err, results) {
						
					expect(err).to.be.null
					LabelDB.getLabels(function(err,data) {  
						var inserted = data[0]
						expect(stubLabel.name).to.be.eql(inserted.name)
						expect(stubLabel.description).to.be.eql(inserted.description)
						expect(stubLabel.color).to.be.eql(inserted.color)
						LabelDB.deleteLabel(stubLabel.name)
						done()
					})
				}) 			

			}



	}) 

})
