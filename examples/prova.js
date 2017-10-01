var jsonfile = require('jsonfile') ,
homedir = require('homedir'),
path = require('path')


var d= path.join(homedir(), 'test', 'dsp_test','test_repo', 'labels.json') 
jsonfile.readFile(d, function(err, res) {
		console.log(err)

})
