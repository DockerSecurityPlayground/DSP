var Model__currentElementID = 0;
var Model__networkID = 0;
var Model__CONTAINER_BASENAME = "element_";
var Model__NETWORK_BASENAME = "network_";
// Angular scope variable
var Model__AppScope = null;
var NETWORK_ELEMENT_TYPE = "NetworkElement";
var NETWORK_TYPE = 'Network';
var theParent = null;
var Graph__NetworkElementLabel = {
  type : NETWORK_ELEMENT_TYPE,
  contentHTML : '<h5 id="toptitle" class="no-selection" style="margin:0px;">'+NETWORK_ELEMENT_TYPE+'</h5><br>'+
  '<img src="assets/docker_image_icons/host.png" width="48" height="48">'
};
var elementToEdit = '';
var theGraph;

function Graph__getElement(e) {
  return theGraph.model.cells[e];
}

function getCellsByName(name) {
  var cells = theGraph.model.cells;
  return _.filter(cells, {name: name});
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

// Update the name of the cell
function Graph__update(cell, newName, oldName) {
  var label = cell.value;
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
    e.name= newName;
  });
  // cells.remove(oldName);
  // cells.put(newName, cell);
}

function Graph__addPort(graph, v1, value, x, y, width, height, style, offsetX, offsetY, relative = true) {
  var port = graph.insertVertex(v1, null, value , x, y, width, height, style, relative);
  port.setConnectable(true);
  // Adds the ports at various relative locations
  port.geometry.offset = new mxPoint(offsetX, offsetY);
}

function Graph__addFirstPort(graph, v1, name) {
  // Graph__addPort(graph, v1, 'Trigger', 0, 0.25, 16, 16, 'port;image=editors/images/overlays/flash.png;align=right;imageAlign=right;spacingRight=18', -6, -8);
  Graph__addPort(graph, v1, {type: 'Interface', name: name }, 0, 0.25, 16, 16, 'port;image=/editors/images/ethernet.png;align=right;imageAlign=right;spacingRight=18', -6, -8);
}
function Graph__addSecondPort(graph, v1, name) {
  Graph__addPort(graph, v1, {type: 'Interface', name: name}, 0, 0.75, 16, 16, 'port;image=/editors/images/ethernet.png;align=right;imageAlign=right;spacingRight=18', -6, -4);
}
function Graph__addThirdPort(graph, v1, name) {
  Graph__addPort(graph, v1, {type: 'Interface', name: name}, 1, 0.25, 16, 16, 'port;image=/editors/images/ethernet.png;spacingLeft=18', -8, -8);
}
function Graph__addFourthPort(graph, v1, name) {
  Graph__addPort(graph, v1, {type: 'Interface', name: name}, 1, 0.75, 16, 16,'port;image=/editors/images/ethernet.png;spacingLeft=18', -8, -4);
}


function Graph__addPorts(graph, v1, numPorts) {
  switch(numPorts) {
    case 1:
      Graph__addFirstPort(graph, v1);
      break;
    case 2:
      Graph__addFirstPort(graph, v1);
      Graph__addSecondPort(graph, v1);
      break;
    case 3:
      Graph__addFirstPort(graph, v1);
      Graph__addSecondPort(graph, v1);
      Graph__addThirdPort(graph, v1);
      break;
    case 4:
      Graph__addFirstPort(graph, v1);
      Graph__addSecondPort(graph, v1);
      Graph__addThirdPort(graph, v1);
      Graph__addFourthPort(graph, v1);
      break;
    default:
      console.log("Strange number");
      break;
  }
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
function Graph__getElement(e) {
  return theGraph.model.cells[e];
}
// Update the name of the cell
function Graph__update(cell, newName, oldName) {
  var label = cell.value;
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
    e.name= newName;
  });
  // cells.remove(oldName);
  // cells.put(newName, cell);
}
function Graph__ElementCreate(graph, nameContainer, x, y) {
  var parent = graph.getDefaultParent();
  var model = graph.getModel();
  var v1 = null;
  var label = Graph__NetworkElementLabel;

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
    Graph__addFirstPort(graph, v1, nameContainer);
    Graph__addSecondPort(graph, v1, nameContainer);
    Graph__addThirdPort(graph, v1, nameContainer);
    Graph__addFourthPort(graph, v1, nameContainer);
  }
  finally {
    graph.setSelectionCell(v1);
    model.endUpdate();
    Graph__update(v1, nameContainer, NETWORK_ELEMENT_TYPE);
  }
}
// If error create html tag
function Graph__isValidXML(canvasXML) {
  var doc = mxUtils.parseXml(canvasXML);
  // In some browser the error occurs in html tag
  if (doc.documentElement.tagName == "html")  {
    return false;
    // In other browser the library returns an error inside activeElement tag
  } else if (doc.activeElement.tagName == "parsererror") {
    return false;
  } else {
    return true;
  }
}

function Graph__NetworkCreate(graph, nameNetwork, x, y) {
  var parent = graph.getDefaultParent();
  console.log(parent);
  var model = graph.getModel();
  var v1 = null;
  model.beginUpdate();
  try {
    // NOTE: For non-HTML labels the image must be displayed via the style
    // rather than the label markup, so use 'image=' + image for the style.
    // as follows: v1 = graph.insertVertex(parent, null, label,
    // pt.x, pt.y, 120, 120, 'image=' + image);
    //
var ne = {
      type: NETWORK_TYPE,
      contentHTML : '<h5 class="no-selection">'+nameNetwork+'</h5>',
      name: nameNetwork
    }
    v1 = graph.insertVertex(parent, nameNetwork, ne, x, y, 120, 120, 'shape=cloud');


    v1.setConnectable(true);

    // Presets the collapsed size
    v1.geometry.alternateBounds = new mxRectangle(0, 0, 120, 40);
  }
  finally {
    graph.setSelectionCell(v1);
    model.endUpdate();
    // Graph__update(v1, nameContainer, NETWORK_ELEMENT_TYPE);
  }
}
function Graph__AddConnection(name1, name2, index) {
  var connections = theGraph.model.cells[name1]
  var firstC = connections.children[index];
  var network = theGraph.model.cells[name2]
  var parent = theGraph.getDefaultParent();
  theGraph.getModel().beginUpdate();
  try {
    var e = theGraph.insertEdge(parent, null, '', firstC, network);
    // console.log(e);
  } finally {
    theGraph.getModel().endUpdate();
  }
}
function Graph__CreateGraphFromStructure(data) {
  console.log("FROM STRUCTURE")
  var networkList = data.networkList;
  var containerListToDraw = data.clistToDraw
  var networkNames = networkList.map(a => a.name)
  var containerNames = containerListToDraw.map( c => c.name);
  console.log(containerNames);
  console.log(networkNames);
  // Create networks
  for (var i = 0; i < networkNames.length; i++) {
    Graph__NetworkCreate(theGraph, networkNames[i], 200, i*100);
  }
  // Create elements
  for (var i = 0; i < containerNames.length; i++) {
    Graph__ElementCreate(theGraph, containerNames[i], 1, i*100);
    var createdElement = Graph__getElement(containerNames[i]);
    var children = createdElement.children;
    var currentAttachedNetwork = 0;
    var MAX_NETWORK_ATTACHMENTS = 4;
    // Get networks
    var c = _.findWhere(containerListToDraw, {name: containerNames[i]});
    _.each(c.networks, (n, networkName) => {
      Graph__AddConnection(containerNames[i], networkName, currentAttachedNetwork++);
    })
  }
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
