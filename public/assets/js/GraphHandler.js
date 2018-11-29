GraphHandler = function GraphHandler(cname) {
	var modes=["ADD", "REMOVE", "EDIT"]
	var testCurrent = { name : "TEST", icon: "assets/router.png", networkList:[{name:"192.168.1.1", color:"green" },{name:"192.168.1.1", color:"blue" },{name:"192.168.2.1", color:"red" }] } 
	//var current = testCurrent
	var current = null

	var currentMode = modes[0]
	//var controller = angular.element(document.querySelector("#appController")).controller()	;
	var callbackOk = function(message) {
		console.log("EVERYTHING OK IN GRAPHHANDLER, ELEMENT DRAWED")
	}
	// DEFAULT CALLBACKERROR, IT MUST BE MODIFIED BY CONTROLLER
	var callbackError = function(message) {
		console.log("ERROR IN GRAPH HANDLER :"+message)

	}
	var callbackDelete = function(message) {
		console.log("DELETE IN GRAPH HANDLER :"+message)
	}
	var callbackEdit = function(message) {
		console.log("EDIT IN GRAPH HANDLER :"+message)
	}
	var Drawer = function Drawer(c)
	{
		var canvas = c;
		var _paddingXText = 20,
		    _paddingYText = -30,
		    _sizeText = 15;
		    _sizeLabelNetwork = 15,
		    _paddingXLeft = 100;


		var loadGroup = function loadGroup(id,arr, coords) {
			var group = new fabric.Group(arr , { left: coords.x, top: coords.y ,
			//In order to block the controls
			selectable: false,
			hasControls : false,
			id : id
				});
			 canvas.add(group)
		} ;
		function drawNetwork(networkList, networkText, coords , imgHeight) {
			var paddingYLeft = 0 ,
			    paddingXLeft = -80 ,
			    paddingYRight = 0,
			    paddingXRight = 100,
			    paddingYBottom = 120,
			    paddingXBottom = 20,
			    verticalOffset = 15

      // NOTE: name is the IP, to change
			//networkList : { name , color,  position }
			networkList.forEach(function(e) {

      var toDisplay = e.isDynamic ? e.nameNetwork + "(DHCP)": e.name;
			switch (e.position) {
				case "right":
					//Network ADDRESS
					var text = new fabric.Text(toDisplay, {
									fontSize: _sizeLabelNetwork,
									fill:e.color,
									left: coords.x + paddingXRight,
									top: coords.y + paddingYRight,
									selectable: false,
									hasControls : false
									});
					paddingYRight +=verticalOffset
					networkText.push(text)
					break
				case 'left':
					//Network ADDRESS
					var text = new fabric.Text(toDisplay, {
									fontSize: _sizeLabelNetwork,
									fill:e.color,
									left: coords.x + paddingXLeft,
									top: coords.y + paddingYLeft,
									selectable: false,
									hasControls : false
									});
					paddingYLeft +=verticalOffset
					networkText.push(text)
					break

				case 'bottom':
					//Network ADDRESS
					var text = new fabric.Text(toDisplay, {
									fontSize: _sizeLabelNetwork,
									fill:e.color,
									left: coords.x + paddingXBottom,
									top: coords.y + paddingYBottom,
									selectable: false,
									hasControls : false
									});
					paddingYBottom +=verticalOffset
					networkText.push(text)
					break


				default :
				break
				}


			})


		}
		return {


			/*
				create a new Element
					element { name : icon: }
				networkList {
						network : { name, color, position }

					    }
			*/

			createElement : function createElement(element, coords, networkList)  {

				if(!element || !element.name || !element.icon) throw Error("element null")

				var name = element.name
				if(element.ports) {
					_.each(element.ports, function (ele, key) {
					name+=" "+key+"=>"+ele+";"

				})
				}
				 title = new fabric.Text(name, {
									fontWeight: 'bold italic', fontSize: _sizeText,
									left: coords.x+  _paddingXText,
									top: coords.y +  _paddingYText ,
									selectable: false,
									id: 'Title',
									hasControls : false

									});
				var networkText = []
				//Draw only if is not empty and is defined
				if(networkList && networkList.length > 0)
					drawNetwork(networkList, networkText, coords)

			//image container
			  fabric.Image.fromURL(element.icon , function(img) {
			    img.set({
			      left: coords.x,
			      top: coords.y,
			      selectable: false,
			      hasControls : false
			    });

					//load networks and draw
					loadGroup(element.name, [title,img].concat(networkText), coords)
				});
		}
	}
   }//End DRAWER



	//Default c
	if(!cname)
		cname = 'c'
	var canvas = this.__canvas = new fabric.Canvas(cname)
	var canMove = true

	//Stop dragging
	  function setDraggingMode(element, val) {
	    element.lockMovementX = val;
	    element.lockMovementY = val;
	  }
	  function onMoving(e) {
		setDraggingMode(e.target, !canMove);
	    }

	  canvas.on({
	    'object:moving': onMoving
	  });


	fabric.Object.prototype.transparentCorners = false;
	var sizeCanvas = { width : canvas.getWidth() ,
			   height : canvas.getHeight()
			}



	var drawer = Drawer(canvas)



	initCanvas()
	//Forbid graphic elements to go out from the canvas
	function limitBoundary(obj)
	{


         // if object is too big ignore
        if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
            return;
        }
        obj.setCoords();
        // top-left  corner
        if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
            obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
            obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
        }
        // bot-right corner
        if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
            obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
            obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
        }



	}

	function initCanvas()
	{

	// Initialization :
	//Default mode : addMode
	setAddMode()
	canvas.on('object:moving', function(e) {
		var targetObject = e.target
		var coords = getMouseCoords(e)
		limitBoundary(targetObject)

	})

	}
	//UPDATE CALLBACK OF MOUSE  and Draw again
	function setAddMode()
	{
		currentMode = "ADD"
		//disable selection in add mode : only create
		setSelection(false)
		//update callback CLICK : it must have to draw
		updateCallback('mouse:down', function(e)
		{

		// if null or undefined
		if(!current)
			callbackError("CURRENT NULL" )
		else
		{
		var  coords = getMouseCoords(e);
			var name = current.name
			var icon = current.icon
			var ports = current.ports
			drawer.createElement({name: name, ports:ports, icon: icon},coords, current.networkList );
			//ok , element drawed, notify controller
			callbackOk(name)

		}
	    })
	}


	function getMouseCoords(event)
	{
	  var pointer = canvas.getPointer(event.e);
	  var posX = pointer.x;
	  var posY = pointer.y;
		return { x: posX, y:posY};
	}



	//Disable/enable  selection for objects
	function setSelection(value) {

		canvas.forEachObject(function(obj) {
			obj.set({selectable: value});

		});
	}


	//Update listener for mouse actions, if only nameEvent is gived it simply remove old callbacks
	function updateCallback(nameEvent, func) {
		//Remove old listeners
		if(canvas.__eventListeners !== undefined)
			canvas.__eventListeners[nameEvent] = [];
		// if it's not a funciton don't update callback
		if(typeof func === 'function')
			canvas.on(nameEvent, func);
	}


	function removeElement(target) {
			canvas.remove(target);
	}





	return  {

		//Set current element { {name, icon } , networkList { n1 {name, color} , ... }  }
		setCurrent : function setCurrent(c)
		{
			current = c
		},
		setAddMode : setAddMode,
		canDrag : function canDrag(val) {
			canMove = val
		},
		setRemoveMode : function setRemoveMode()
		{
			currentMode = "REMOVE"
			setSelection(false)

			updateCallback('mouse:down', function(e)
			{

				var target = e.target
				console.log(target)
				//If target isn't null delete  and notify controller
				if(target != null)
				{
					removeElement(target)
					callbackDelete(target.id)
				}

				else callbackDelete()



			})


		},
		loadGraphicJSON : function loadGraphicJSON(json) {
                                console.log("IN LOAD GRAPHICS")
                                var jsonString = JSON.stringify(json, null, 2)
                                // giper 04/10/17 : fix the url location to use not only with localhost
                                var url = window.location.href
                                var arr = url.split("/");
                                var currentLocation =  arr[0] + "//" + arr[2] + "/assets/docker_image_icons/";
                                // Replace http://localhost to replace with current location
                                var jsonStringFixed = jsonString.replace (/https?:\/\/.*\/docker_image_icons\//g, currentLocation)

                                var fixedJSON = JSON.parse(jsonStringFixed);
                                canvas.loadFromJSON(fixedJSON, canvas.renderAll.bind(canvas));
		},
		getGraphicJSON : function getGraphicJSON() {
			return canvas.toJSON(['id'])

		},
		setEditMode : function setEditMode()
		{
			currentMode = "EDIT"
			 //EnableSelection
		   	setSelection(true);
			updateCallback('mouse:down', function(e) {

			var target = e.target
			console.log(target)
			//If target isn't null delete  and notify controller
			if(target != null)
			{
				callbackEdit(target.id)
			}

			else callbackEdit(undefined)

			})
		},
		registerOkCallback : function registerOkCallback(okHandler)
		{
			callbackOk = okHandler
		},
		//called when error checking verified
		registerErrorCallback : function registerErrorCallback(eHandler)
		{
			callbackError = eHandler
		},
		//called when delete operation completes
		registerDeleteCallback : function registerDeleteCallback(eHandler)
		{
			callbackDelete = eHandler
		},
		//called when delete operation completes
		registerEditCallback : function registerEditCallback(eHandler)
		{
			callbackEdit = eHandler
		}
	}
}
