class gp_StateManager {
	errorType() {return "ERROR" } 
	infoType() {return "INFO" } 
	warningType() {return "WARNING" } 

	//First state
	constructor(name, message, type) {
		if (!name || !message )
			throw new Error("name message type cannot be null") 
		type= type || this.infoType()
		this.states = {}
		this.states[name] = {message: message, type: type} 
		this.current_state =  {name:name, message: this.states[name].message, 			type: this.states[name].type}  
	}

	addState(name, message, type) {
		this.states[name] = {message: message, type:type } 
	}


	setState(nameState) {
		this.current_state = this.state[nameState]
	}

	updateState(name) {
		var state = this.states[name] 
		if(!state)
			throw new Error("State "+name+" doesn't exists") 
		this.current_state =  {name:name, message: state.message, 			type: state.type}  
	}	
}
	

	
