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
    theGraph.setDropEnabled(false);


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

  configureStylesheet(theGraph)

  // Override the insertVertex in order to use toDraw property
  var mxGraphInsertVertex = mxGraph.prototype.insertVertex;
  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  var parent = theGraph.getDefaultParent();
  if (mxGraphInsertVertex.name != "myInsertVertex")
  mxGraph.prototype.insertVertex = function myInsertVertex(parent, id, value, x, y, width, height, style, relative) {
    var v1 =  mxGraphInsertVertex.apply(this, [parent, id, value.contentHTML, x, y, width, height, style, relative]);
    // Add type in cell
    v1.type = value.type;
    v1.name = value.name;
    return v1;
  }
  }

}
