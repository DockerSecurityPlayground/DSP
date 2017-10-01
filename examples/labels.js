var db = require('./db.js'),
     backhelp = require('./backend_helpers.js'),
    async = require('async') 

var getLabels = function getLabels(callback) { 
	db.labels.find().toArray(callback);

}

var createLabel = function createLabel(data, callback) { 
	async.waterfall([
	//Validate data
	function (cb) { 
		try {
			backhelp.verify(data, 
				[ "name", 
				  "description", 	
				  "color"
				])	

		}
		catch(e) {
			cb(e);
			return;
		}
		cb(null, data)

	},
	// create the label 	
	function(label_data, cb) {
		var write = JSON.parse(JSON.stringify(label_data))
		write._id = label_data.name
		db.labels.insertOne(write, { w:1, safe:true }, cb); 


	}
	], 
	//ended 
	function(err, results) {
		//send errors 
		if(err) 
			callback(err)
		else
			callback(err, err ? null : results)

	}
	)

}
var deleteLabel = function deleteLabel(name, callback) { 
	db.labels.deleteOne({_id: name }) 
}



exports.deleteLabel = deleteLabel;
exports.getLabels = getLabels; 
exports.createLabel = createLabel; 
exports.version = "0.1.0"; 
