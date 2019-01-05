var elementNumber = 0;
var networkNumber = 0;
var elementToEdit = '';
var theGraph;
const NETWORK_ELEMENT = "NetworkElement";
var Popup = function Popup(cell, appScope) {
  var popupContainer ;
  function show() {
    if (cell.type == 'Network') {
      var content = document.createElement('div');
      var networkName = cell.id;
      if(cell.edges && cell.edges.length != 0) {
      alert("Cannot change a network with attached elements");
      } else {
        appScope.onClickEditNetwork(networkName);
      }
    }  else if (cell.type == 'NetworkElement') { // SHOW EditNetworkElement
      var content = document.createElement('div');
      var containerName = cell.id;
      // Initialized for the end
      elementToEdit = containerName;
      appScope.onClickEditContainer(containerName);
    }
  }
  return {
    show: show
  };
}

// Is already connected the cell?
function isAlreadyConnected(networkCell, elementCell) {
  for (var i = 0; i < networkCell.getEdgeCount(); i++)  {
   var source = ( networkCell.edges[i]).source;
   var target = ( networkCell.edges[i]).target;
    console.log(source);
    console.log(target);
    console.log(elementCell);
   if (source.name == elementCell.name || target.name == elementCell.name)
       return true;
   else
       return false;
  }
  return false;
}

function graphRenameProperty(cells, oldName, newName) {
  // Do nothing if the names are the same
  if (oldName == newName) {
    return cells;
  }
  // Check for the old property name to avoid a ReferenceError in strict mode.
  if (cells.hasOwnProperty(oldName)) {
    cells[newName] = cells[oldName];
    delete cells[oldName];
  }
  return cells;
};


function getCellsByName(name) {
  var cells = theGraph.model.cells;
  return _.filter(cells, {name: name});
}

function updateElement(cell, newName, oldName) {
  var label = cell.value;
  console.log(label);
  var $html = $('<div />',{html:label});
  // replace "Headline" with "whatever" => Doesn't work
  $html.find('h5').html(newName);
  var newValue = $html.html();
  theGraph.model.setValue(cell, newValue)

  // Update the cell id
  cell.setId(newName);
  var cells = theGraph.model.cells
  // Rename cell in id
  graphRenameProperty(cells, oldName, newName);
  var cellWithOldName = getCellsByName(oldName);
  _.each(cellWithOldName, function(e) {
    console.log("Update "+e.name);
    e.name= newName;
  });
  // cells.remove(oldName);
  // cells.put(newName, cell);
}

function graphEditCallback(oldName, newName) {
  console.log("Oldname"+ oldName);
  var theCell = theGraph.getModel().getCell(oldName);
  // Update the cell name
  updateElement(theCell, newName, oldName);
}


function addPort(graph, v1, value, x, y, width, height, style, offsetX, offsetY, relative = true) {
  var port = graph.insertVertex(v1, null, value , x, y, width, height, style, relative);
  port.setConnectable(true);
  // Adds the ports at various relative locations
  port.geometry.offset = new mxPoint(offsetX, offsetY);
}

function addFirstPort(graph, v1, name) {
  // addPort(graph, v1, 'Trigger', 0, 0.25, 16, 16, 'port;image=editors/images/overlays/flash.png;align=right;imageAlign=right;spacingRight=18', -6, -8);
  addPort(graph, v1, {type: 'Interface', name: name }, 0, 0.25, 16, 16, 'port;image=editors/images/ethernet.png;align=right;imageAlign=right;spacingRight=18', -6, -8);
}
function addSecondPort(graph, v1, name) {
  addPort(graph, v1, {type: 'Interface', name: name}, 0, 0.75, 16, 16, 'port;image=editors/images/ethernet.png;align=right;imageAlign=right;spacingRight=18', -6, -4);
}
function addThirdPort(graph, v1, name) {
  addPort(graph, v1, {type: 'Interface', name: name}, 1, 0.25, 16, 16, 'port;image=editors/images/ethernet.png;spacingLeft=18', -8, -8);
}
function addFourthPort(graph, v1, name) {
  addPort(graph, v1, {type: 'Interface', name: name}, 1, 0.75, 16, 16,'port;image=editors/images/ethernet.png;spacingLeft=18', -8, -4);
}


function addPorts(graph, v1, numPorts) {
  switch(numPorts) {
    case 1:
      addFirstPort(graph, v1);
      break;
    case 2:
      addFirstPort(graph, v1);
      addSecondPort(graph, v1);
      break;
    case 3:
      addFirstPort(graph, v1);
      addSecondPort(graph, v1);
      addThirdPort(graph, v1);
      break;
    case 4:
      addFirstPort(graph, v1);
      addSecondPort(graph, v1);
      addThirdPort(graph, v1);
      addFourthPort(graph, v1);
      break;
    default:
      console.log("Strange number");
      break;
  }
}


/*
  Add an element, the label describes the drawn element
  */
function addSidebarElementIcon(graph, sidebar, label, image, appScope) {
  // Function that is executed when the image is dropped on
  // the graph. The cell argument points to the cell under
  // the mousepointer if there is one.
  var funct = function(graph, evt, cell, x, y) {
    var nameContainer = "element"+ elementNumber;
    console.log("add new element");
    appScope.newContainer(nameContainer);
    elementNumber++;
    var parent = graph.getDefaultParent();
    var model = graph.getModel();
    var v1 = null;
    console.log("ELEMNENTS");
    console.log(getCellsByName("element0") );

    label.name = nameContainer;

    model.beginUpdate();
    try {
      // NOTE: For non-HTML labels the image must be displayed via the style
      // rather than the label markup, so use 'image=' + image for the style.
      // as follows: v1 = graph.insertVertex(parent, null, label,
      // pt.x, pt.y, 120, 120, 'image=' + image);
      v1 = graph.insertVertex(parent, nameContainer, label, x, y, 120, 120);
      v1.setConnectable(false);

      // Presets the collapsed size
      v1.geometry.alternateBounds = new mxRectangle(0, 0, 120, 40);
      addFirstPort(graph, v1, nameContainer);
      addSecondPort(graph, v1, nameContainer);
      addThirdPort(graph, v1, nameContainer);
      addFourthPort(graph, v1, nameContainer);
    }
    finally {
      graph.setSelectionCell(v1);
      model.endUpdate();
      console.log(v1);
      updateElement(v1, nameContainer, NETWORK_ELEMENT);
    }
  }

  // Creates the image which is used as the sidebar icon (drag source)
  var img = document.createElement('img');
  img.setAttribute('src', image);
  img.style.width = '48px';
  img.style.height = '48px';
  img.title = 'Drag this to the diagram to create a new vertex';
  sidebar.appendChild(img);

  var dragElt = document.createElement('div');
  dragElt.style.border = 'dashed black 1px';
  dragElt.style.width = '120px';
  dragElt.style.height = '120px';

  // Creates the image which is used as the drag icon (preview)
  var ds = mxUtils.makeDraggable(img, graph, funct, dragElt, 0, 0, true, true);
  ds.setGuidesEnabled(true);

};

function addSidebarNetworkIcon(graph, sidebar, image, appScope) {
  // Function that is executed when the image is dropped on
  // the graph. The cell argument points to the cell under
  // the mousepointer if there is one.
  var funct = function(graph, evt, cell, x, y) {
    var nameNetwork = "network_"+ networkNumber;
    // appScope.newContainer(nameContainer);
    networkNumber++;
    appScope.addNetworkElement(nameNetwork);


    var parent = graph.getDefaultParent();
    var model = graph.getModel();
    var v1 = null;
    model.beginUpdate();
    try {
      // NOTE: For non-HTML labels the image must be displayed via the style
      // rather than the label markup, so use 'image=' + image for the style.
      // as follows: v1 = graph.insertVertex(parent, null, label,
      // pt.x, pt.y, 120, 120, 'image=' + image);
      v1 = graph.insertVertex(parent, nameNetwork, {
        type: 'Network',
        contentHTML : '<h5>'+nameNetwork+'</h5>',
        name: nameNetwork
      }, x, y, 120, 120, 'shape=cloud');


      v1.setConnectable(true);

      // Presets the collapsed size
      v1.geometry.alternateBounds = new mxRectangle(0, 0, 120, 40);
    }
    finally {
      graph.setSelectionCell(v1);
      model.endUpdate();
      // updateElement(v1, nameContainer, NETWORK_ELEMENT);
    }
  }

  // Creates the image which is used as the sidebar icon (drag source)
  var img = document.createElement('img');
  img.setAttribute('src', image);
  img.style.width = '48px';
  img.style.height = '48px';
  img.title = 'Drag this to the diagram to create a new vertex';
  sidebar.appendChild(img);

  var dragElt = document.createElement('div');
  dragElt.style.border = 'dashed black 1px';
  dragElt.style.width = '120px';
  dragElt.style.height = '120px';

  // Creates the image which is used as the drag icon (preview)
  var ds = mxUtils.makeDraggable(img, graph, funct, dragElt, 0, 0, true, true);
  ds.setGuidesEnabled(true);
}

function configureStylesheet(graph) {
  var style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
  style[mxConstants.STYLE_GRADIENTCOLOR] = '#FFFFFF';
  style[mxConstants.STYLE_FILLCOLOR] = '#FFFFFF';
  style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
  style[mxConstants.STYLE_FONTCOLOR] = '#000000';
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_OPACITY] = '80';
  style[mxConstants.STYLE_FONTSIZE] = '10';
  style[mxConstants.STYLE_FONTSTYLE] = 0;
  style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
  style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
  graph.getStylesheet().putDefaultVertexStyle(style);

  // NOTE: Alternative vertex style for non-HTML labels should be as
  // follows. This repaces the above style for HTML labels.
  /*var style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_LABEL;
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
  style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
  style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
  style[mxConstants.STYLE_SPACING_TOP] = '56';
  style[mxConstants.STYLE_GRADIENTCOLOR] = '#7d85df';
  style[mxConstants.STYLE_STROKECOLOR] = '#5d65df';
  style[mxConstants.STYLE_FILLCOLOR] = '#adc5ff';
  style[mxConstants.STYLE_FONTCOLOR] = '#1d258f';
  style[mxConstants.STYLE_FONTFAMILY] = 'Verdana';
  style[mxConstants.STYLE_FONTSIZE] = '12';
  style[mxConstants.STYLE_FONTSTYLE] = '1';
  style[mxConstants.STYLE_ROUNDED] = '1';
  style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
  style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
  style[mxConstants.STYLE_OPACITY] = '80';
  graph.getStylesheet().putDefaultVertexStyle(style);*/

  style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
  style[mxConstants.STYLE_FILLCOLOR] = '#FF9103';
  style[mxConstants.STYLE_GRADIENTCOLOR] = '#F8C48B';
  style[mxConstants.STYLE_STROKECOLOR] = '#E86A00';
  style[mxConstants.STYLE_FONTCOLOR] = '#000000';
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_OPACITY] = '80';
  style[mxConstants.STYLE_STARTSIZE] = '30';
  style[mxConstants.STYLE_FONTSIZE] = '16';
  style[mxConstants.STYLE_FONTSTYLE] = 1;
  graph.getStylesheet().putCellStyle('group', style);

  style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
  style[mxConstants.STYLE_FONTCOLOR] = '#774400';
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_PERIMETER_SPACING] = '6';
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
  style[mxConstants.STYLE_FONTSIZE] = '10';
  style[mxConstants.STYLE_FONTSTYLE] = 2;
  style[mxConstants.STYLE_IMAGE_WIDTH] = '16';
  style[mxConstants.STYLE_IMAGE_HEIGHT] = '16';
  graph.getStylesheet().putCellStyle('port', style);

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
  style[mxConstants.STYLE_STROKEWIDTH] = '2';
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
};

function addToolbarButton(editor, toolbar, action, label, image, isTransparent) {
  var button = document.createElement('button');
  button.style.fontSize = '10';
  if (image != null)
  {
    var img = document.createElement('img');
    img.setAttribute('src', image);
    img.style.width = '16px';
    img.style.height = '16px';
    img.style.verticalAlign = 'middle';
    img.style.marginRight = '2px';
    button.appendChild(img);
  }
  if (isTransparent)
  {
    button.style.background = 'transparent';
    button.style.color = '#FFFFFF';
    button.style.border = 'none';
  }
  mxEvent.addListener(button, 'click', function(evt)
    {
      editor.execute(action);
    });
  mxUtils.write(button, label);
  toolbar.appendChild(button);
};

function showModalWindow(graph, title, content, width, height) {
  var background = document.createElement('div');
  background.style.position = 'absolute';
  background.style.left = '0px';
  background.style.top = '0px';
  background.style.right = '0px';
  background.style.bottom = '0px';
  background.style.background = 'black';
  mxUtils.setOpacity(background, 50);
  document.body.appendChild(background);

  if (mxClient.IS_IE)
  {
    new mxDivResizer(background);
  }

  var x = Math.max(0, document.body.scrollWidth/2-width/2);
  var y = Math.max(10, (document.body.scrollHeight ||
    document.documentElement.scrollHeight)/2-height*2/3);
  var wnd = new mxWindow(title, content, x, y, width, height, false, true);
  wnd.setClosable(true);

  // Fades the background out after after the window has been closed
  wnd.addListener(mxEvent.DESTROY, function(evt)
    {
      graph.setEnabled(true);
      mxEffects.fadeOut(background, 50, true,
        10, 30, true);
    });

  graph.setEnabled(false);
  graph.tooltipHandler.hide();
  wnd.setVisible(true);
};

function showModalProperties(graph, content) {
  showModalWindow(graph, 'Properties', content, 400, 300);
}

// Assigns some global constants for general behaviour, eg. minimum
// size (in pixels) of the active region for triggering creation of
// new connections, the portion (100%) of the cell area to be used
// for triggering new connections, as well as some fading options for
// windows and the rubberband selection.
function mxInitConstants() {
  mxConstants.MIN_HOTSPOT_SIZE = 16;
  mxConstants.DEFAULT_HOTSPOT = 1;
}

function mxInitGuides() {
  // Enables guides
  mxGraphHandler.prototype.guidesEnabled = true;
  // Alt disables guides
  mxGuide.prototype.isEnabledForEvent = function(evt) {
    return !mxEvent.isAltDown(evt);
  };
}

function mxWorkaroundIE() {
  // Workaround for Internet Explorer ignoring certain CSS directives
  if (mxClient.IS_QUIRKS)
  {
    document.body.style.overflow = 'hidden';
    new mxDivResizer(container);
    new mxDivResizer(outline);
    new mxDivResizer(toolbar);
    new mxDivResizer(sidebar);
    new mxDivResizer(status);
  }
}


function mxInitGraph(graph, appScope) {
  // Disable highlight of cells when dragging from toolbar
  theGraph = graph;
  graph.setDropEnabled(false);
  appScope.initGraphCallbacks([graphEditCallback]);

  // Override the insertVertex in order to use toDraw property
  var mxGraphInsertVertex = mxGraph.prototype.insertVertex;
  mxGraph.prototype.insertVertex = function(parent, id, value, x, y, width, height, style, relative) {
    var v1 =  mxGraphInsertVertex.apply(this, [parent, id, value.contentHTML, x, y, width, height, style, relative]);
    // Add type in cell
    v1.type = value.type;
    v1.name = value.name;
    return v1;
  }

  mxCloneCells = mxGraph.prototype.cloneCells;
  mxGraph.prototype.cloneCells = function(cells, allowInvalidEdges, mapping, keepPosition) {
    console.log("clone cells");
    return mxCloneCell.apply(this, arguments);
  }



  // Override the valid target: must not be an Interface
  /*
  var isValidTarget = mxConnectionHandler.prototype.isValidTarget;
  mxConnectionHandler.prototype.isValidTarget = function(cell) {
    isInterface = cell.type  == 'Interface';
    console.log("in valid target");
    return !isInterface &&  isValidTarget.apply(this, arguments);
  }
  */
  mxGetEdgeValidationError = mxGraph.prototype.getEdgeValidationError;
  mxGraph.prototype.getEdgeValidationError = function(edge, source, target) {
    if(target.type == 'Interface') {
      return "Cannot attach to interface";
    }
    if(isAlreadyConnected(target, source)) {
      return "Network Element Already connected";
    }
    return mxGetEdgeValidationError.apply(this, arguments);
  }

  mxCellRemove= mxGraphModel.prototype.remove;
  mxGraphModel.prototype.remove = function(cell) {
    var canRemove = true;
    console.log("CELL: "+cell);
    if(cell.type == 'NetworkElement') {
      console.log("Delete container from model");
      appScope.deleteContainer(cell.name);
    } else if(cell.type == 'Network') {
      console.log("Delete network from model (only if no attached element)");
      if(!appScope.isNetworkAttached(cell.name)) {
          appScope.deleteNetwork(cell.name);
      } else {
        alert("Cannot delete a network with attached elements");
        canRemove = false;
      }
    }
    if (canRemove) {
      console.log("CAN REMOVE");
      return mxCellRemove.apply(this, arguments);
    } else {
      console.log("CANNOTREMOVE");
      return false;
    }
  }


  // Called when the connection is created
  var mxCreateEdge = mxConnectionHandler.prototype.createEdge;
  mxConnectionHandler.prototype.createEdge = function(value, source, target, style) {
    appScope.attachNetwork(target.name, source.name);
    return mxCreateEdge.apply(this, arguments);
  }
  // Override remove edge
  mxRemoveEdge = mxCell.prototype.removeEdge
  mxCell.prototype.removeEdge = function(edge, isOutgoing) {
    function firstDelete() {
      return (edge.source != null && edge.target != null);
    }
    // Remove connection only when is the first call
    if (firstDelete()) {
      appScope.detachNetwork(edge.target.name, edge.source.name);
    }
    return mxRemoveEdge.apply(this, arguments);
  }




  // Uses the port icon while connections are previewed
  graph.connectionHandler.getConnectImage = function(state)
  {
    return new mxImage(state.style[mxConstants.STYLE_IMAGE], 16, 16);
  };

  // Centers the port icon on the target port
  graph.connectionHandler.targetConnectImage = true;

  // Does not allow dangling edges
  graph.setAllowDanglingEdges(false);
  // Disables drag-and-drop into non-swimlanes.
  graph.isValidDropTarget = function(cell, cells, evt)
  {
    return this.isSwimlane(cell);
  };

  // Disables drilling into non-swimlanes.
  graph.isValidRoot = function(cell)
  {
    return this.isValidDropTarget(cell);
  }

  // Does not allow selection of locked cells
  graph.isCellSelectable = function(cell)
  {
    return !this.isCellLocked(cell);
  };


  // Returns a shorter label if the cell is collapsed and no
  // label for expanded groups
  graph.getLabel = function(cell)
  {
    var tmp = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"

    if (this.isCellLocked(cell))
    {
      // Returns an empty label but makes sure an HTML
      // element is created for the label (for event
      // processing wrt the parent label)
      return '';
    }
    else if (this.isCellCollapsed(cell))
    {
      var index = tmp.indexOf('</h1>');

      if (index > 0)
      {
        tmp = tmp.substring(0, index+5);
      }
    }

    return tmp;
  }
  // Disables HTML labels for swimlanes to avoid conflict
  // for the event processing on the child cells. HTML
  // labels consume events before underlying cells get the
  // chance to process those events.
  //
  // NOTE: Use of HTML labels is only recommended if the specific
  // features of such labels are required, such as special label
  // styles or interactive form fields. Otherwise non-HTML labels
  // should be used by not overidding the following function.
  // See also: configureStylesheet.
  graph.isHtmlLabel = function(cell) {
    return !this.isSwimlane(cell);
  }

  // To disable the folding icon, use the following code:
  /*graph.isCellFoldable = function(cell)
  {
    return false;
  }
  */

    /* Called from angular when the edit is closed
     *
     */

    /* Event for right click
     *
     */
    graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
      // Do not fire an event here as mxEditor will
      // consume the event and start the in-place editor.
      if (graph.isEnabled() &&
        !mxEvent.isConsumed(evt) &&
        cell != null &&
        graph.isCellEditable(cell))
      {
        if (graph.model.isEdge(cell) ||
          !graph.isHtmlLabel(cell)) {
          graph.startEditingAtCell(cell);
        }
        else
        {
          Popup(cell, appScope).show();
        }
      }

      // Disables any default behaviour for the double click
      mxEvent.consume(evt);
    };

  // graph.dblClick = function(evt, cell) {
  //   // Do not fire a DOUBLE_CLICK event here as mxEditor will
  //   // consume the event and start the in-place editor.
  //   if (this.isEnabled() &&
  //     !mxEvent.isConsumed(evt) &&
  //     cell != null &&
  //     this.isCellEditable(cell))
  //   {
  //     if (this.model.isEdge(cell) ||
  //       !this.isHtmlLabel(cell))
  //     {
  //       this.startEditingAtCell(cell);
  //     }
  //     else
  //     {
  //       var content = document.createElement('div');
  //       var d = document.createElement('div');
  //       d.setAttribute('ng-include', "'views/add_element.html'");
  //       content.innerHTML = d.outerHTML;
  //       showModalWindow(this, 'Properties', content, 400, 300);
  //     }
  //   }

  //   // Disables any default behaviour for the double click
  //   mxEvent.consume(evt);
  // };

  // Enables new connections
  graph.setConnectable(true);

  // Adds all required styles to the graph (see below)
  configureStylesheet(graph);
}

function mxInitEditor(editor, container) {
  // Sets the graph container and configures the editor
  editor.setGraphContainer(container);
  var config = mxUtils.load(
    'editors/config/keyhandler-commons.xml').
    getDocumentElement();
  editor.configure(config);
  // Defines the default group to be used for grouping. The
  // default group is a field in the mxEditor instance that
  // is supposed to be a cell which is cloned for new cells.
  // The groupBorderSize is used to define the spacing between
  // the children of a group and the group bounds.
  var group = new mxCell('Group', new mxGeometry(), 'group');
  group.setVertex(true);
  group.setConnectable(false);
  editor.defaultGroup = group;
  editor.groupBorderSize = 20;
}

function createHints() {

}

function addNetworkElement(graph, sidebar, appScope) {
  addSidebarElementIcon(graph, sidebar,
    {
      type : 'NetworkElement',
      contentHTML : '<h5 id="toptitle" style="margin:0px;">'+NETWORK_ELEMENT+'</h5><br>'+
      '<img src="assets/docker_image_icons/host.png" width="48" height="48">'
    },
    'assets/docker_image_icons/host.png'
    ,
    appScope);

}
function addNetwork(graph, sidebar, appScope) {
  addSidebarNetworkIcon(graph, sidebar, 'assets/docker_image_icons/network_icon.png', appScope);

}
