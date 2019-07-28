function configureStylesheet(theGraph) {
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
theGraph.getStylesheet().putDefaultVertexStyle(style);

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
theGraph.getStylesheet().putCellStyle('group', style);

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
theGraph.getStylesheet().putCellStyle('port', style);

style = theGraph.getStylesheet().getDefaultEdgeStyle();
style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
style[mxConstants.STYLE_STROKEWIDTH] = '2';
style[mxConstants.STYLE_ROUNDED] = true;
style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
};
function main(container) {
// Checks if the browser is supported
if (!mxClient.isBrowserSupported()) {
// Displays an error message if the browser is not supported.
mxUtils.error('Browser is not supported!', 200, false);
}
else {
  // Disables the built-in context menu
  mxEvent.disableContextMenu(container);
  // Creates the theGraph inside the given container
  theGraph = new mxGraph(container);

  // Enables rubberband selection
  new mxRubberband(theGraph);
  // Uses the port icon while connections are previewed
  theGraph.connectionHandler.getConnectImage = function(state)
  {
  return new mxImage(state.style[mxConstants.STYLE_IMAGE], 16, 16);
  };

  // Centers the port icon on the target port
  theGraph.connectionHandler.targetConnectImage = true;
  theGraph.setEnabled(false);


  // Does not allow dangling edges
  theGraph.setAllowDanglingEdges(false);
  // Disables drag-and-drop into non-swimlanes.
  theGraph.isValidDropTarget = function(cell, cells, evt)
  {
  return this.isSwimlane(cell);
  };

  // Disables drilling into non-swimlanes.
  theGraph.isValidRoot = function(cell)
  {
  return this.isValidDropTarget(cell);
  }

  // Does not allow selection of locked cells
  theGraph.isCellSelectable = function(cell)
  {
  return !this.isCellLocked(cell);
  };


  // Returns a shorter label if the cell is collapsed and no
  // label for expanded groups
  theGraph.getLabel = function(cell)
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
  theGraph.isHtmlLabel = function(cell) {
  return !this.isSwimlane(cell);
  }

  // To disable the folding icon, use the following code:
  /*theGraph.isCellFoldable = function(cell)
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
  theGraph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
  // Do not fire an event here as mxEditor will
  // consume the event and start the in-place editor.
  if (theGraph.isEnabled() &&
    !mxEvent.isConsumed(evt) &&
    cell != null &&
    theGraph.isCellEditable(cell))
  {
  if (theGraph.model.isEdge(cell) ||
    !theGraph.isHtmlLabel(cell)) {
  theGraph.startEditingAtCell(cell);
  }
  else
  {
  Popup(cell, Model__AppScope).show();
  }
  }

  // Disables any default behaviour for the double click
  mxEvent.consume(evt);
  };

  configureStylesheet(theGraph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  var parent = theGraph.getDefaultParent();
  }
}
