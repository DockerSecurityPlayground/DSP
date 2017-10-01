function dsp_currentLab()  { 

this.currentLab = {};



this.resetLab = function resetLab() {
	this.currentLab.name = '';
	this.currentLab.repoName = '';
}


this.updateLab= function updateLab(repoName, labName) {
		this.currentLab.name = labName;
		this.currentLab.repoName = repoName;
}

}
