var dsp_LabsCtrl = function($scope, AjaxService, CurrentLabService , BreadCrumbs, WalkerService, $location) {
	console.log("labsCtrl")
	var self = this; 
	self.username = ''
	self.labelProjects = [] 
	self.repos = []
	self.allLabs = []
	self.filteredLabels = []	;
	self.filteredRepos = []
	self.filteredDifficulty = [];
		
	$scope.difficulty = {
		availableOptions: [
		  {id: 1, name: 'Beginner'},
		  {id: 2, name: 'Medium'},
		  {id: 3, name: 'Advanced'},
		  {id: 4, name: 'Expert'},
		]};

	BreadCrumbs.breadCrumbs('/labs')
	CurrentLabService.resetLab()
	var urlRedirect =  '/lab/use/';

	var promises = AjaxService.init()
		promises.dAll
			.then(function(res) {
			self.repos = WalkerService.repos
			self.filteredRepos = WalkerService.repos
			console.log(self.repos[1].labs[0])
		}, 
			function(err){} )

		promises.dLabel 
			.then(function(res) {

				self.labelProjects = AjaxService.projectLabels.labels;
				
			},
				function(err){ })

		promises.dConfig
			.then(function(res) {
				self.username = res.name
			},
				function(err) {})
			


	self.getURL = 	function(nameRepo, labName) {
		$location.url(urlRedirect+nameRepo+'/'+labName)
	}	

	self.addNew = function addNew() {
		console.log("add new") 
	}
	//Filter by label 
	self.hasLabel = function hasLabel(item) {
		
		if(_.isEmpty(self.filteredLabels))
			return true;

		else { 
			var ret = false
			var labelsItem = item.labels;
			_.each(labelsItem, function(e) {

				if(_.findIndex(self.filteredLabels, {name: e.name}) !== -1)
				{

					ret = true
					return 
				}
			})
			return ret
		}

	}

	// Filter by difficulty
	self.difficultyCheck = function difficultyCheck(lab) {
		
		if(_.isEmpty(self.filteredDifficulty))
			return true;

		else if(_.indexOf(self.filteredDifficulty, lab.informations.difficulty) !== -1)
				{
					return true;
				}
	}

	$scope.showRunning = function () {
		var ret
		_.each(self.repos, function(e){			
			if(_.findWhere(e.labs, {state: "RUNNING"}) !== undefined){
				console.log(_.findWhere(e.labs, {state: "RUNNING"}))
				ret = true
				return ret
			}
			else
				ret = false				
		})
		return ret

	}

}
