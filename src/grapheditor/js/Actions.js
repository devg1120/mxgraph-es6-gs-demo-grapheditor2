/**
 * Copyright (c) 2006-2020, JGraph Ltd
 * Copyright (c) 2006-2020, draw.io AG
 *
 * Constructs the actions object for the given UI.
 */
//import * as m from "../../../../dist/mxgraph.es.js";
import * as m from "mxgraph-es6-gs";
import { Editor } from "./Editor.js";
import { OpenFile } from "./Editor.js"; //GUSA
import { FilenameDialog } from "./Editor.js";
import { OutlineWindow } from "./Dialogs.js";
import { LayersWindow } from "./Dialogs.js";
import { OpenDialog } from "./Dialogs.js"; //GUSA

/*
export function Actions(editorUi) {
  this.editorUi = editorUi;
  this.actions = new Object();
  this.init();
}
*/

export class Actions extends m.mxEventSource {
  constructor(editorUi) {
    super();
    this.editorUi = editorUi;
    this.actions = new Object();
    this.init();
  }
} //class end
/**
 * Adds the default actions.
 */
Actions.prototype.init = function () {
  var ui = this.editorUi;
  var editor = ui.editor;
  var graph = editor.graph;
  var isGraphEnabled = function () {
    return (
      Action.prototype.isEnabled.apply(this, arguments) && graph.isEnabled()
    );
  };

  // File actions
  this.addAction("new...", function () {
    graph.openLink(ui.getUrl());
  });
  this.addAction("open...", function () {
    window.openNew = true;
    window.openKey = "open";

    ui.openFile();
  });
  this.addAction("import...", function () {
    window.openNew = false;
    window.openKey = "import";

    // Closes dialog after open
    window.openFile = new OpenFile(
      m.mxUtils.bind(this, function () {
        ui.hideDialog();
      }),
    );

    window.openFile.setConsumer(
      m.mxUtils.bind(this, function (xml, filename) {
        try {
          var doc = m.mxUtils.parseXml(xml);
          editor.graph.setSelectionCells(
            editor.graph.importGraphModel(doc.documentElement),
          );
        } catch (e) {
          m.mxUtils.alert(
            m.mxResources.get("invalidOrMissingFile") + ": " + e.message,
          );
        }
      }),
    );

    // Removes openFile if dialog is closed
    ui.showDialog(
      new OpenDialog(this).container,
      320,
      220,
      true,
      true,
      function () {
        window.openFile = null;
      },
    );
  }).isEnabled = isGraphEnabled;
  this.addAction(
    "save",
    function () {
      ui.saveFile(false);
    },
    null,
    null,
    Editor.ctrlKey + "+S",
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "saveAs...",
    function () {
      ui.saveFile(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+S",
  ).isEnabled = isGraphEnabled;
  this.addAction("export...", function () {
    ui.showDialog(new ExportDialog(ui).container, 300, 296, true, true);
  });
  this.addAction("editDiagram...", function () {
    var dlg = new EditDiagramDialog(ui);
    ui.showDialog(dlg.container, 620, 420, true, false);
    dlg.init();
  });
  this.addAction("pageSetup...", function () {
    ui.showDialog(new PageSetupDialog(ui).container, 320, 220, true, true);
  }).isEnabled = isGraphEnabled;
  this.addAction(
    "print...",
    function () {
      ui.showDialog(new PrintDialog(ui).container, 300, 180, true, true);
    },
    null,
    "sprite-print",
    Editor.ctrlKey + "+P",
  );
  this.addAction("preview", function () {
    m.mxUtils.show(graph, null, 10, 10);
  });

  // Edit actions
  this.addAction(
    "undo",
    function () {
      ui.undo();
    },
    null,
    "sprite-undo",
    Editor.ctrlKey + "+Z",
  );
  this.addAction(
    "redo",
    function () {
      ui.redo();
    },
    null,
    "sprite-redo",
    !m.mxClient.IS_WIN ? Editor.ctrlKey + "+Shift+Z" : Editor.ctrlKey + "+Y",
  );

  // Select actions
  this.addAction(
    "select",
    function () {
      ui.select();
    },
    null,
    "sprite-select",
    null,
  );
  this.addAction(
    "pan",
    function () {
      ui.pan();
    },
    null,
    "sprite-pan",
    null,
  );

 //
  this.addAction(
    "cut",
    function () {
      m.mxClipboard.cut(graph);
    },
    null,
    "sprite-cut",
    Editor.ctrlKey + "+X",
  );
  this.addAction(
    "copy",
    function () {
      try {
        m.mxClipboard.copy(graph);
      } catch (e) {
        ui.handleError(e);
      }
    },
    null,
    "sprite-copy",
    Editor.ctrlKey + "+C",
  );
  this.addAction(
    "paste",
    function () {
      if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
        m.mxClipboard.paste(graph);
      }
    },
    false,
    "sprite-paste",
    Editor.ctrlKey + "+V",
  );
  this.addAction("pasteHere", function (evt) {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      graph.getModel().beginUpdate();
      try {
        var cells = m.mxClipboard.paste(graph);

        if (cells != null) {
          var includeEdges = true;

          for (var i = 0; i < cells.length && includeEdges; i++) {
            includeEdges = includeEdges && graph.model.isEdge(cells[i]);
          }

          var t = graph.view.translate;
          var s = graph.view.scale;
          var dx = t.x;
          var dy = t.y;
          var bb = null;

          if (cells.length == 1 && includeEdges) {
            var geo = graph.getCellGeometry(cells[0]);

            if (geo != null) {
              bb = geo.getTerminalPoint(true);
            }
          }

          bb =
            bb != null
              ? bb
              : graph.getBoundingBoxFromGeometry(cells, includeEdges);

          if (bb != null) {
            var x = Math.round(
              graph.snap(graph.popupMenuHandler.triggerX / s - dx),
            );
            var y = Math.round(
              graph.snap(graph.popupMenuHandler.triggerY / s - dy),
            );

            graph.cellsMoved(cells, x - bb.x, y - bb.y);
          }
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });

  this.addAction(
    "copySize",
    function (evt) {
      var cell = graph.getSelectionCell();

      if (
        graph.isEnabled() &&
        cell != null &&
        graph.getModel().isVertex(cell)
      ) {
        var geo = graph.getCellGeometry(cell);

        if (geo != null) {
          ui.copiedSize = new m.mxRectangle(
            geo.x,
            geo.y,
            geo.width,
            geo.height,
          );
        }
      }
    },
    null,
    null,
    "Alt+Shift+X",
  );

  this.addAction(
    "pasteSize",
    function (evt) {
      if (
        graph.isEnabled() &&
        !graph.isSelectionEmpty() &&
        ui.copiedSize != null
      ) {
        graph.getModel().beginUpdate();

        try {
          var cells = graph.getSelectionCells();

          for (var i = 0; i < cells.length; i++) {
            if (graph.getModel().isVertex(cells[i])) {
              var geo = graph.getCellGeometry(cells[i]);

              if (geo != null) {
                geo = geo.clone();
                geo.width = ui.copiedSize.width;
                geo.height = ui.copiedSize.height;

                graph.getModel().setGeometry(cells[i], geo);
              }
            }
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    "Alt+Shift+V",
  );

  function deleteCells(includeEdges) {
    // Cancels interactive operations
    graph.escape();
    var select = graph.deleteCells(
      graph.getDeletableCells(graph.getSelectionCells()),
      includeEdges,
    );

    if (select != null) {
      graph.setSelectionCells(select);
    }
  }

  this.addAction(
    "delete",
    function (evt) {
      deleteCells(evt != null && m.mxEvent.isControlDown(evt));
    },
    null,
    null,
    "Delete",
  );
  this.addAction("deleteAll", function () {
    if (!graph.isSelectionEmpty()) {
      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();

        for (var i = 0; i < cells.length; i++) {
          graph.cellLabelChanged(cells[i], "");
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });
  this.addAction(
    "deleteLabels",
    function () {
      if (!graph.isSelectionEmpty()) {
        graph.getModel().beginUpdate();
        try {
          var cells = graph.getSelectionCells();

          for (var i = 0; i < cells.length; i++) {
            graph.cellLabelChanged(cells[i], "");
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Delete",
  );
  this.addAction(
    "duplicate",
    function () {
      try {
        graph.setSelectionCells(graph.duplicateCells());
        graph.scrollCellToVisible(graph.getSelectionCell());
      } catch (e) {
        ui.handleError(e);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+D",
  );
  this.put(
    "turn",
    new Action(
      m.mxResources.get("turn") + " / " + m.mxResources.get("reverse"),
      function (evt) {
        graph.turnShapes(
          graph.getSelectionCells(),
          evt != null ? m.mxEvent.isShiftDown(evt) : false,
        );
      },
      null,
      null,
      Editor.ctrlKey + "+R",
    ),
  );
  this.addAction(
    "selectVertices",
    function () {
      graph.selectVertices(null, true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+I",
  );
  this.addAction(
    "selectEdges",
    function () {
      graph.selectEdges();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+E",
  );
  this.addAction(
    "selectAll",
    function () {
      graph.selectAll(null, true);
    },
    null,
    null,
    Editor.ctrlKey + "+A",
  );
  this.addAction(
    "selectNone",
    function () {
      graph.clearSelection();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+A",
  );
  this.addAction(
    "lockUnlock",
    function () {
      if (!graph.isSelectionEmpty()) {
        graph.getModel().beginUpdate();
        try {
          var defaultValue = graph.isCellMovable(graph.getSelectionCell())
            ? 1
            : 0;
          graph.toggleCellStyles(m.mxConstants.STYLE_MOVABLE, defaultValue);
          graph.toggleCellStyles(m.mxConstants.STYLE_RESIZABLE, defaultValue);
          graph.toggleCellStyles(m.mxConstants.STYLE_ROTATABLE, defaultValue);
          graph.toggleCellStyles(m.mxConstants.STYLE_DELETABLE, defaultValue);
          graph.toggleCellStyles(m.mxConstants.STYLE_EDITABLE, defaultValue);
          graph.toggleCellStyles("connectable", defaultValue);
        } finally {
          graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+L",
  );

  // Navigation actions
  this.addAction(
    "home",
    function () {
      graph.home();
    },
    null,
    null,
    "Shift+Home",
  );
  this.addAction(
    "exitGroup",
    function () {
      graph.exitGroup();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+Home",
  );
  this.addAction(
    "enterGroup",
    function () {
      graph.enterGroup();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+End",
  );
  this.addAction(
    "collapse",
    function () {
      graph.foldCells(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Home",
  );
  this.addAction(
    "expand",
    function () {
      graph.foldCells(false);
    },
    null,
    null,
    Editor.ctrlKey + "+End",
  );

  // Arrange actions
  this.addAction(
    "toFront",
    function () {
      graph.orderCells(false);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+F",
  );
  this.addAction(
    "toBack",
    function () {
      graph.orderCells(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+B",
  );
  this.addAction(
    "group",
    function () {
      if (graph.isEnabled()) {
        var cells = m.mxUtils.sortCells(graph.getSelectionCells(), true);

        if (
          cells.length == 1 &&
          !graph.isTable(cells[0]) &&
          !graph.isTableRow(cells[0])
        ) {
          graph.setCellStyles("container", "1");
        } else {
          cells = graph.getCellsForGroup(cells);

          if (cells.length > 1) {
            graph.setSelectionCell(graph.groupCells(null, 0, cells));
          }
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+G",
  );
  this.addAction(
    "ungroup",
    function () {
      if (graph.isEnabled()) {
        var cells = graph.getSelectionCells();

        graph.model.beginUpdate();
        try {
          var temp = graph.ungroupCells();

          // Clears container flag for remaining cells
          if (cells != null) {
            for (var i = 0; i < cells.length; i++) {
              if (graph.model.contains(cells[i])) {
                if (
                  graph.model.getChildCount(cells[i]) == 0 &&
                  graph.model.isVertex(cells[i])
                ) {
                  graph.setCellStyles("container", "0", [cells[i]]);
                }

                temp.push(cells[i]);
              }
            }
          }
        } finally {
          graph.model.endUpdate();
        }

        graph.setSelectionCells(temp);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+U",
  );
  this.addAction("removeFromGroup", function () {
    if (graph.isEnabled()) {
      var cells = graph.getSelectionCells();

      // Removes table rows and cells
      if (cells != null) {
        var temp = [];

        for (var i = 0; i < cells.length; i++) {
          if (!graph.isTableRow(cells[i]) && !graph.isTableCell(cells[i])) {
            temp.push(cells[i]);
          }
        }

        graph.removeCellsFromParent(temp);
      }
    }
  });
  // Adds action
  this.addAction(
    "edit",
    function () {
      if (graph.isEnabled()) {
        graph.startEditingAtCell();
      }
    },
    null,
    null,
    "F2/Enter",
  );
  this.addAction(
    "editData...",
    function () {
      var cell = graph.getSelectionCell() || graph.getModel().getRoot();
      ui.showDataDialog(cell);
    },
    null,
    null,
    Editor.ctrlKey + "+M",
  );
  this.addAction(
    "editTooltip...",
    function () {
      if (graph.isEnabled() && !graph.isSelectionEmpty()) {
        var cell = graph.getSelectionCell();
        var tooltip = "";

        if (m.mxUtils.isNode(cell.value)) {
          var tmp = null;

          if (
            Graph.translateDiagram &&
            Graph.diagramLanguage != null &&
            cell.value.hasAttribute("tooltip_" + Graph.diagramLanguage)
          ) {
            tmp = cell.value.getAttribute("tooltip_" + Graph.diagramLanguage);
          }

          if (tmp == null) {
            tmp = cell.value.getAttribute("tooltip");
          }

          if (tmp != null) {
            tooltip = tmp;
          }
        }

        var dlg = new TextareaDialog(
          ui,
          m.mxResources.get("editTooltip") + ":",
          tooltip,
          function (newValue) {
            graph.setTooltipForCell(cell, newValue);
          },
        );
        ui.showDialog(dlg.container, 320, 200, true, true);
        dlg.init();
      }
    },
    null,
    null,
    "Alt+Shift+T",
  );
  this.addAction("openLink", function () {
    var link = graph.getLinkForCell(graph.getSelectionCell());

    if (link != null) {
      graph.openLink(link);
    }
  });
  this.addAction(
    "editLink...",
    function () {
      if (graph.isEnabled() && !graph.isSelectionEmpty()) {
        var cell = graph.getSelectionCell();
        var value = graph.getLinkForCell(cell) || "";

        ui.showLinkDialog(value, m.mxResources.get("apply"), function (link) {
          link = m.mxUtils.trim(link);
          graph.setLinkForCell(cell, link.length > 0 ? link : null);
        });
      }
    },
    null,
    null,
    "Alt+Shift+L",
  );
  this.put(
    "insertImage",
    new Action(m.mxResources.get("image") + "...", function () {
      if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
        graph.clearSelection();
        ui.actions.get("image").funct();
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.put(
    "insertLink",
    new Action(m.mxResources.get("link") + "...", function () {
      if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
        ui.showLinkDialog(
          "",
          m.mxResources.get("insert"),
          function (link, docs) {
            link = m.mxUtils.trim(link);

            if (link.length > 0) {
              var icon = null;
              var title = graph.getLinkTitle(link);

              if (docs != null && docs.length > 0) {
                icon = docs[0].iconUrl;
                title = docs[0].name || docs[0].type;
                title = title.charAt(0).toUpperCase() + title.substring(1);

                if (title.length > 30) {
                  title = title.substring(0, 30) + "...";
                }
              }

              var linkCell = new m.mxCell(
                title,
                new m.mxGeometry(0, 0, 100, 40),
                "fontColor=#0000EE;fontStyle=4;rounded=1;overflow=hidden;" +
                  (icon != null
                    ? "shape=label;imageWidth=16;imageHeight=16;spacingLeft=26;align=left;image=" +
                      icon
                    : "spacing=10;"),
              );
              linkCell.vertex = true;

              var pt = graph.getCenterInsertPoint(
                graph.getBoundingBoxFromGeometry([linkCell], true),
              );
              linkCell.geometry.x = pt.x;
              linkCell.geometry.y = pt.y;

              graph.setLinkForCell(linkCell, link);
              graph.cellSizeUpdated(linkCell, true);

              graph.getModel().beginUpdate();
              try {
                linkCell = graph.addCell(linkCell);
                graph.fireEvent(
                  new m.mxEventObject("cellsInserted", "cells", [linkCell]),
                );
              } finally {
                graph.getModel().endUpdate();
              }

              graph.setSelectionCell(linkCell);
              graph.scrollCellToVisible(graph.getSelectionCell());
            }
          },
        );
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "link...",
    m.mxUtils.bind(this, function () {
      if (graph.isEnabled()) {
        if (graph.cellEditor.isContentEditing()) {
          var elt = graph.getSelectedElement();
          var link = graph.getParentByName(elt, "A", graph.cellEditor.textarea);
          var oldValue = "";

          // Workaround for FF returning the outermost selected element after double
          // click on a DOM hierarchy with a link inside (but not as topmost element)
          if (link == null && elt != null && elt.getElementsByTagName != null) {
            // Finds all links in the selected DOM and uses the link
            // where the selection text matches its text content
            var links = elt.getElementsByTagName("a");

            for (var i = 0; i < links.length && link == null; i++) {
              if (links[i].textContent == elt.textContent) {
                link = links[i];
              }
            }
          }

          if (link != null && link.nodeName == "A") {
            oldValue = link.getAttribute("href") || "";
            graph.selectNode(link);
          }

          var selState = graph.cellEditor.saveSelection();

          ui.showLinkDialog(
            oldValue,
            m.mxResources.get("apply"),
            m.mxUtils.bind(this, function (value) {
              graph.cellEditor.restoreSelection(selState);

              if (value != null) {
                graph.insertLink(value);
              }
            }),
          );
        } else if (graph.isSelectionEmpty()) {
          this.get("insertLink").funct();
        } else {
          this.get("editLink").funct();
        }
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "autosize",
    function () {
      var cells = graph.getSelectionCells();

      if (cells != null) {
        graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            if (graph.getModel().getChildCount(cell)) {
              graph.updateGroupBounds([cell], 20);
            } else {
              var state = graph.view.getState(cell);
              var geo = graph.getCellGeometry(cell);

              if (
                graph.getModel().isVertex(cell) &&
                state != null &&
                state.text != null &&
                geo != null &&
                graph.isWrapping(cell)
              ) {
                geo = geo.clone();
                geo.height = state.text.boundingBox.height / graph.view.scale;
                graph.getModel().setGeometry(cell, geo);
              } else {
                graph.updateCellSize(cell);
              }
            }
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+Y",
  );
  this.addAction("formattedText", function () {
    var refState = graph.getView().getState(graph.getSelectionCell());

    if (refState != null) {
      graph.stopEditing();
      var value = refState.style["html"] == "1" ? null : "1";

      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();

        for (var i = 0; i < cells.length; i++) {
          state = graph.getView().getState(cells[i]);

          if (state != null) {
            var html = m.mxUtils.getValue(state.style, "html", "0");

            if (html == "1" && value == null) {
              var label = graph.convertValueToString(state.cell);

              if (m.mxUtils.getValue(state.style, "nl2Br", "1") != "0") {
                // Removes newlines from HTML and converts breaks to newlines
                // to match the HTML output in plain text
                label = label.replace(/\n/g, "").replace(/<br\s*.?>/g, "\n");
              }

              // Removes HTML tags
              var temp = document.createElement("div");
              temp.innerHTML = graph.sanitizeHtml(label);
              label = m.mxUtils.extractTextWithWhitespace(temp.childNodes);

              graph.cellLabelChanged(state.cell, label);
              graph.setCellStyles("html", value, [cells[i]]);
            } else if (html == "0" && value == "1") {
              // Converts HTML tags to text
              var label = m.mxUtils.htmlEntities(
                graph.convertValueToString(state.cell),
                false,
              );

              if (m.mxUtils.getValue(state.style, "nl2Br", "1") != "0") {
                // Converts newlines in plain text to breaks in HTML
                // to match the plain text output
                label = label.replace(/\n/g, "<br/>");
              }

              graph.cellLabelChanged(state.cell, graph.sanitizeHtml(label));
              graph.setCellStyles("html", value, [cells[i]]);
            }
          }
        }

        ui.fireEvent(
          new m.mxEventObject(
            "styleChanged",
            "keys",
            ["html"],
            "values",
            [value != null ? value : "0"],
            "cells",
            cells,
          ),
        );
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });
  this.addAction("wordWrap", function () {
    var state = graph.getView().getState(graph.getSelectionCell());
    var value = "wrap";

    graph.stopEditing();

    if (
      state != null &&
      state.style[m.mxConstants.STYLE_WHITE_SPACE] == "wrap"
    ) {
      value = null;
    }

    graph.setCellStyles(m.mxConstants.STYLE_WHITE_SPACE, value);
  });
  this.addAction("rotation", function () {
    var value = "0";
    var state = graph.getView().getState(graph.getSelectionCell());

    if (state != null) {
      value = state.style[m.mxConstants.STYLE_ROTATION] || value;
    }

    var dlg = new FilenameDialog(
      ui,
      value,
      m.mxResources.get("apply"),
      function (newValue) {
        if (newValue != null && newValue.length > 0) {
          graph.setCellStyles(m.mxConstants.STYLE_ROTATION, newValue);
        }
      },
      m.mxResources.get("enterValue") +
        " (" +
        m.mxResources.get("rotation") +
        " 0-360)",
    );

    ui.showDialog(dlg.container, 375, 80, true, true);
    dlg.init();
  });
  // View actions
  this.addAction(
    "resetView",
    function () {
      graph.zoomTo(1);
      ui.resetScrollbars();
    },
    null,
    null,
    "Home",
  );
  this.addAction(
    "zoomIn",
    function (evt) {
      if (graph.isFastZoomEnabled()) {
        graph.lazyZoom(true, true, ui.buttonZoomDelay);
      } else {
        graph.zoomIn();
      }
    },
    null,
    null,
    Editor.ctrlKey + " + (Numpad) / Alt+Mousewheel",
  );
  this.addAction(
    "zoomOut",
    function (evt) {
      if (graph.isFastZoomEnabled()) {
        graph.lazyZoom(false, true, ui.buttonZoomDelay);
      } else {
        graph.zoomOut();
      }
    },
    null,
    null,
    Editor.ctrlKey + " - (Numpad) / Alt+Mousewheel",
  );
  this.addAction(
    "fitWindow",
    function () {
      var bounds = graph.isSelectionEmpty()
        ? graph.getGraphBounds()
        : graph.getBoundingBox(graph.getSelectionCells());
      var t = graph.view.translate;
      var s = graph.view.scale;

      bounds.x = bounds.x / s - t.x;
      bounds.y = bounds.y / s - t.y;
      bounds.width /= s;
      bounds.height /= s;

      if (graph.backgroundImage != null) {
        bounds.add(
          new m.mxRectangle(
            0,
            0,
            graph.backgroundImage.width,
            graph.backgroundImage.height,
          ),
        );
      }

      if (bounds.width == 0 || bounds.height == 0) {
        graph.zoomTo(1);
        ui.resetScrollbars();
      } else {
        graph.fitWindow(bounds);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+H",
  );
  this.addAction(
    "fitPage",
    m.mxUtils.bind(this, function () {
      if (!graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = graph.pageFormat;
      var ps = graph.pageScale;
      var cw = graph.container.clientWidth - 10;
      var ch = graph.container.clientHeight - 10;
      var scale =
        Math.floor(20 * Math.min(cw / fmt.width / ps, ch / fmt.height / ps)) /
        20;
      graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(graph.container)) {
        var pad = graph.getPagePadding();
        graph.container.scrollTop = pad.y * graph.view.scale - 1;
        graph.container.scrollLeft =
          Math.min(
            pad.x * graph.view.scale,
            (graph.container.scrollWidth - graph.container.clientWidth) / 2,
          ) - 1;
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+J",
  );
  this.addAction(
    "fitTwoPages",
    m.mxUtils.bind(this, function () {
      if (!graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = graph.pageFormat;
      var ps = graph.pageScale;
      var cw = graph.container.clientWidth - 10;
      var ch = graph.container.clientHeight - 10;

      var scale =
        Math.floor(
          20 * Math.min(cw / (2 * fmt.width) / ps, ch / fmt.height / ps),
        ) / 20;
      graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(graph.container)) {
        var pad = graph.getPagePadding();
        graph.container.scrollTop = Math.min(
          pad.y,
          (graph.container.scrollHeight - graph.container.clientHeight) / 2,
        );
        graph.container.scrollLeft = Math.min(
          pad.x,
          (graph.container.scrollWidth - graph.container.clientWidth) / 2,
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+J",
  );
  this.addAction(
    "fitPageWidth",
    m.mxUtils.bind(this, function () {
      if (!graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = graph.pageFormat;
      var ps = graph.pageScale;
      var cw = graph.container.clientWidth - 10;

      var scale = Math.floor((20 * cw) / fmt.width / ps) / 20;
      graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(graph.container)) {
        var pad = graph.getPagePadding();
        graph.container.scrollLeft = Math.min(
          pad.x * graph.view.scale,
          (graph.container.scrollWidth - graph.container.clientWidth) / 2,
        );
      }
    }),
  );
  this.put(
    "customZoom",
    new Action(
      m.mxResources.get("custom") + "...",
      m.mxUtils.bind(this, function () {
        var dlg = new FilenameDialog(
          this.editorUi,
          parseInt(graph.getView().getScale() * 100),
          m.mxResources.get("apply"),
          m.mxUtils.bind(this, function (newValue) {
            var val = parseInt(newValue);

            if (!isNaN(val) && val > 0) {
              graph.zoomTo(val / 100);
            }
          }),
          m.mxResources.get("zoom") + " (%)",
        );
        this.editorUi.showDialog(dlg.container, 300, 80, true, true);
        dlg.init();
      }),
      null,
      null,
      Editor.ctrlKey + "+0",
    ),
  );
  this.addAction(
    "pageScale...",
    m.mxUtils.bind(this, function () {
      var dlg = new FilenameDialog(
        this.editorUi,
        parseInt(graph.pageScale * 100),
        m.mxResources.get("apply"),
        m.mxUtils.bind(this, function (newValue) {
          var val = parseInt(newValue);

          if (!isNaN(val) && val > 0) {
            var change = new ChangePageSetup(ui, null, null, null, val / 100);
            change.ignoreColor = true;
            change.ignoreImage = true;

            graph.model.execute(change);
          }
        }),
        m.mxResources.get("pageScale") + " (%)",
      );
      this.editorUi.showDialog(dlg.container, 300, 80, true, true);
      dlg.init();
    }),
  );

  // Option actions
  var action = null;
  action = this.addAction(
    "grid",
    function () {
      graph.setGridEnabled(!graph.isGridEnabled());
      ui.fireEvent(new m.mxEventObject("gridEnabledChanged"));
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+G",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.isGridEnabled();
  });
  action.setEnabled(false);

  action = this.addAction("guides", function () {
    graph.graphHandler.guidesEnabled = !graph.graphHandler.guidesEnabled;
    ui.fireEvent(new m.mxEventObject("guidesEnabledChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.graphHandler.guidesEnabled;
  });
  action.setEnabled(false);

  action = this.addAction("tooltips", function () {
    graph.tooltipHandler.setEnabled(!graph.tooltipHandler.isEnabled());
    ui.fireEvent(new m.mxEventObject("tooltipsEnabledChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.tooltipHandler.isEnabled();
  });

  action = this.addAction("collapseExpand", function () {
    var change = new ChangePageSetup(ui);
    change.ignoreColor = true;
    change.ignoreImage = true;
    change.foldingEnabled = !graph.foldingEnabled;

    graph.model.execute(change);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.foldingEnabled;
  });
  action.isEnabled = isGraphEnabled;
  action = this.addAction("scrollbars", function () {
    ui.setScrollbars(!ui.hasScrollbars());
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.scrollbars;
  });
  action = this.addAction(
    "pageView",
    m.mxUtils.bind(this, function () {
      ui.setPageVisible(!graph.pageVisible);
    }),
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.pageVisible;
  });
  action = this.addAction(
    "connectionArrows",
    function () {
      graph.connectionArrowsEnabled = !graph.connectionArrowsEnabled;
      ui.fireEvent(new m.mxEventObject("connectionArrowsChanged"));
    },
    null,
    null,
    "Alt+Shift+A",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionArrowsEnabled;
  });
  action = this.addAction(
    "connectionPoints",
    function () {
      graph.setConnectable(!graph.connectionHandler.isEnabled());
      ui.fireEvent(new m.mxEventObject("connectionPointsChanged"));
    },
    null,
    null,
    "Alt+Shift+P",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionHandler.isEnabled();
  });
  action = this.addAction("copyConnect", function () {
    graph.connectionHandler.setCreateTarget(
      !graph.connectionHandler.isCreateTarget(),
    );
    ui.fireEvent(new m.mxEventObject("copyConnectChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionHandler.isCreateTarget();
  });
  action.isEnabled = isGraphEnabled;
  action = this.addAction("autosave", function () {
    ui.editor.setAutosave(!ui.editor.autosave);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return ui.editor.autosave;
  });
  action.isEnabled = isGraphEnabled;
  action.visible = false;

  // Help actions
  this.addAction("help", function () {
    var ext = "";

    if (m.mxResources.isLanguageSupported(m.mxClient.language)) {
      ext = "_" + m.mxClient.language;
    }

    graph.openLink(RESOURCES_PATH + "/help" + ext + ".html");
  });

  var showingAbout = false;

  this.put(
    "about",
    new Action(m.mxResources.get("about") + " Graph Editor...", function () {
      if (!showingAbout) {
        ui.showDialog(
          new AboutDialog(ui).container,
          320,
          280,
          true,
          true,
          function () {
            showingAbout = false;
          },
        );

        showingAbout = true;
      }
    }),
  );

  // Font style actions
  var toggleFontStyle = m.mxUtils.bind(
    this,
    function (key, style, fn, shortcut) {
      return this.addAction(
        key,
        function () {
          if (fn != null && graph.cellEditor.isContentEditing()) {
            fn();
          } else {
            graph.stopEditing(false);

            graph.getModel().beginUpdate();
            try {
              var cells = graph.getSelectionCells();
              graph.toggleCellStyleFlags(
                m.mxConstants.STYLE_FONTSTYLE,
                style,
                cells,
              );

              // Removes bold and italic tags and CSS styles inside labels
              if (
                (style & m.mxConstants.FONT_BOLD) ==
                m.mxConstants.FONT_BOLD
              ) {
                graph.updateLabelElements(
                  graph.getSelectionCells(),
                  function (elt) {
                    elt.style.fontWeight = null;

                    if (elt.nodeName == "B") {
                      graph.replaceElement(elt);
                    }
                  },
                );
              } else if (
                (style & m.mxConstants.FONT_ITALIC) ==
                m.mxConstants.FONT_ITALIC
              ) {
                graph.updateLabelElements(
                  graph.getSelectionCells(),
                  function (elt) {
                    elt.style.fontStyle = null;

                    if (elt.nodeName == "I") {
                      graph.replaceElement(elt);
                    }
                  },
                );
              } else if (
                (style & m.mxConstants.FONT_UNDERLINE) ==
                m.mxConstants.FONT_UNDERLINE
              ) {
                graph.updateLabelElements(
                  graph.getSelectionCells(),
                  function (elt) {
                    elt.style.textDecoration = null;

                    if (elt.nodeName == "U") {
                      graph.replaceElement(elt);
                    }
                  },
                );
              }

              for (var i = 0; i < cells.length; i++) {
                if (graph.model.getChildCount(cells[i]) == 0) {
                  graph.autoSizeCell(cells[i], false);
                }
              }
            } finally {
              graph.getModel().endUpdate();
            }
          }
        },
        null,
        null,
        shortcut,
      );
    },
  );

  toggleFontStyle(
    "bold",
    m.mxConstants.FONT_BOLD,
    function () {
      document.execCommand("bold", false, null);
    },
    Editor.ctrlKey + "+B",
  );
  toggleFontStyle(
    "italic",
    m.mxConstants.FONT_ITALIC,
    function () {
      document.execCommand("italic", false, null);
    },
    Editor.ctrlKey + "+I",
  );
  toggleFontStyle(
    "underline",
    m.mxConstants.FONT_UNDERLINE,
    function () {
      document.execCommand("underline", false, null);
    },
    Editor.ctrlKey + "+U",
  );

  // Color actions
  this.addAction("fontColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_FONTCOLOR, "forecolor", "000000");
  });
  this.addAction("strokeColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_STROKECOLOR);
  });
  this.addAction("fillColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_FILLCOLOR);
  });
  this.addAction("gradientColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_GRADIENTCOLOR);
  });
  this.addAction("backgroundColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, "backcolor");
  });
  this.addAction("borderColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_LABEL_BORDERCOLOR);
  });

  // Format actions
  this.addAction("vertical", function () {
    ui.menus.toggleStyle(m.mxConstants.STYLE_HORIZONTAL, true);
  });
  this.addAction("shadow", function () {
    ui.menus.toggleStyle(m.mxConstants.STYLE_SHADOW);
  });
  this.addAction("solid", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_DASHED, null);
      graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          [null, null],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("dashed", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_DASHED, "1");
      graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          ["1", null],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("dotted", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_DASHED, "1");
      graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, "1 4");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          ["1", "1 4"],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("sharp", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "0");
      graph.setCellStyles(m.mxConstants.STYLE_CURVED, "0");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["0", "0"],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("rounded", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "1");
      graph.setCellStyles(m.mxConstants.STYLE_CURVED, "0");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["1", "0"],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("toggleRounded", function () {
    if (!graph.isSelectionEmpty() && graph.isEnabled()) {
      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();
        var style = graph.getCurrentCellStyle(cells[0]);
        var value =
          m.mxUtils.getValue(style, m.mxConstants.STYLE_ROUNDED, "0") == "1"
            ? "0"
            : "1";

        graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, value);
        graph.setCellStyles(m.mxConstants.STYLE_CURVED, null);
        ui.fireEvent(
          new m.mxEventObject(
            "styleChanged",
            "keys",
            [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
            "values",
            [value, "0"],
            "cells",
            graph.getSelectionCells(),
          ),
        );
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });
  this.addAction("curved", function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "0");
      graph.setCellStyles(m.mxConstants.STYLE_CURVED, "1");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["0", "1"],
          "cells",
          graph.getSelectionCells(),
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
  this.addAction("collapsible", function () {
    var state = graph.view.getState(graph.getSelectionCell());
    var value = "1";

    if (state != null && graph.getFoldingImage(state) != null) {
      value = "0";
    }

    graph.setCellStyles("collapsible", value);
    ui.fireEvent(
      new m.mxEventObject(
        "styleChanged",
        "keys",
        ["collapsible"],
        "values",
        [value],
        "cells",
        graph.getSelectionCells(),
      ),
    );
  });
  this.addAction(
    "editStyle...",
    m.mxUtils.bind(this, function () {
      var cells = graph.getSelectionCells();

      if (cells != null && cells.length > 0) {
        var model = graph.getModel();

        var dlg = new TextareaDialog(
          this.editorUi,
          m.mxResources.get("editStyle") + ":",
          model.getStyle(cells[0]) || "",
          function (newValue) {
            if (newValue != null) {
              graph.setCellStyle(m.mxUtils.trim(newValue), cells);
            }
          },
          null,
          null,
          400,
          220,
        );
        this.editorUi.showDialog(dlg.container, 420, 300, true, true);
        dlg.init();
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+E",
  );
  this.addAction(
    "setAsDefaultStyle",
    function () {
      if (graph.isEnabled() && !graph.isSelectionEmpty()) {
        ui.setDefaultStyle(graph.getSelectionCell());
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+D",
  );
  this.addAction(
    "clearDefaultStyle",
    function () {
      if (graph.isEnabled()) {
        ui.clearDefaultStyle();
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+R",
  );
  this.addAction("addWaypoint", function () {
    var cell = graph.getSelectionCell();

    if (cell != null && graph.getModel().isEdge(cell)) {
      var handler = editor.graph.selectionCellsHandler.getHandler(cell);

      if (handler instanceof m.mxEdgeHandler) {
        var t = graph.view.translate;
        var s = graph.view.scale;
        var dx = t.x;
        var dy = t.y;

        var parent = graph.getModel().getParent(cell);
        var pgeo = graph.getCellGeometry(parent);

        while (graph.getModel().isVertex(parent) && pgeo != null) {
          dx += pgeo.x;
          dy += pgeo.y;

          parent = graph.getModel().getParent(parent);
          pgeo = graph.getCellGeometry(parent);
        }

        var x = Math.round(
          graph.snap(graph.popupMenuHandler.triggerX / s - dx),
        );
        var y = Math.round(
          graph.snap(graph.popupMenuHandler.triggerY / s - dy),
        );

        handler.addPointAt(handler.state, x, y);
      }
    }
  });
  this.addAction("removeWaypoint", function () {
    // TODO: Action should run with "this" set to action
    var rmWaypointAction = ui.actions.get("removeWaypoint");

    if (rmWaypointAction.handler != null) {
      // NOTE: Popupevent handled and action updated in Menus.createPopupMenu
      rmWaypointAction.handler.removePoint(
        rmWaypointAction.handler.state,
        rmWaypointAction.index,
      );
    }
  });
  this.addAction(
    "clearWaypoints",
    function () {
      var cells = graph.getSelectionCells();

      if (cells != null) {
        cells = graph.addAllEdges(cells);

        graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            if (graph.getModel().isEdge(cell)) {
              var geo = graph.getCellGeometry(cell);

              if (geo != null) {
                geo = geo.clone();
                geo.points = null;
                graph.getModel().setGeometry(cell, geo);
              }
            }
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    "Alt+Shift+C",
  );
  action = this.addAction(
    "subscript",
    m.mxUtils.bind(this, function () {
      if (graph.cellEditor.isContentEditing()) {
        document.execCommand("subscript", false, null);
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+,",
  );
  action = this.addAction(
    "superscript",
    m.mxUtils.bind(this, function () {
      if (graph.cellEditor.isContentEditing()) {
        document.execCommand("superscript", false, null);
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+.",
  );
  action = this.addAction(
    "indent",
    m.mxUtils.bind(this, function () {
      // NOTE: Alt+Tab for outdent implemented via special code in
      // keyHandler.getFunction in EditorUi.js. Ctrl+Tab is reserved.
      if (graph.cellEditor.isContentEditing()) {
        document.execCommand("indent", false, null);
      }
    }),
    null,
    null,
    "Shift+Tab",
  );
  this.addAction("image...", function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      var title =
        m.mxResources.get("image") + " (" + m.mxResources.get("url") + "):";
      var state = graph.getView().getState(graph.getSelectionCell());
      var value = "";

      if (state != null) {
        value = state.style[m.mxConstants.STYLE_IMAGE] || value;
      }

      var selectionState = graph.cellEditor.saveSelection();

      ui.showImageDialog(
        title,
        value,
        function (newValue, w, h) {
          // Inserts image into HTML text
          if (graph.cellEditor.isContentEditing()) {
            graph.cellEditor.restoreSelection(selectionState);
            graph.insertImage(newValue, w, h);
          } else {
            var cells = graph.getSelectionCells();

            if (newValue != null && (newValue.length > 0 || cells.length > 0)) {
              var select = null;

              graph.getModel().beginUpdate();
              try {
                // Inserts new cell if no cell is selected
                if (cells.length == 0) {
                  cells = [
                    graph.insertVertex(
                      graph.getDefaultParent(),
                      null,
                      "",
                      0,
                      0,
                      w,
                      h,
                      "shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;",
                    ),
                  ];
                  var pt = graph.getCenterInsertPoint(
                    graph.getBoundingBoxFromGeometry(cells, true),
                  );
                  cells[0].geometry.x = pt.x;
                  cells[0].geometry.y = pt.y;

                  select = cells;
                  graph.fireEvent(
                    new m.mxEventObject("cellsInserted", "cells", select),
                  );
                }

                graph.setCellStyles(
                  m.mxConstants.STYLE_IMAGE,
                  newValue.length > 0 ? newValue : null,
                  cells,
                );

                // Sets shape only if not already shape with image (label or image)
                var style = graph.getCurrentCellStyle(cells[0]);

                if (
                  style[m.mxConstants.STYLE_SHAPE] != "image" &&
                  style[m.mxConstants.STYLE_SHAPE] != "label"
                ) {
                  graph.setCellStyles(
                    m.mxConstants.STYLE_SHAPE,
                    "image",
                    cells,
                  );
                } else if (newValue.length == 0) {
                  graph.setCellStyles(m.mxConstants.STYLE_SHAPE, null, cells);
                }

                if (graph.getSelectionCount() == 1) {
                  if (w != null && h != null) {
                    var cell = cells[0];
                    var geo = graph.getModel().getGeometry(cell);

                    if (geo != null) {
                      geo = geo.clone();
                      geo.width = w;
                      geo.height = h;
                      graph.getModel().setGeometry(cell, geo);
                    }
                  }
                }
              } finally {
                graph.getModel().endUpdate();
              }

              if (select != null) {
                graph.setSelectionCells(select);
                graph.scrollCellToVisible(select[0]);
              }
            }
          }
        },
        graph.cellEditor.isContentEditing(),
        !graph.cellEditor.isContentEditing(),
      );
    }
  }).isEnabled = isGraphEnabled;
  action = this.addAction(
    "layers",
    m.mxUtils.bind(this, function () {
      if (this.layersWindow == null) {
        // LATER: Check outline window for initial placement
        this.layersWindow = new LayersWindow(
          ui,
          document.body.offsetWidth - 280,
          120,
          220,
          196,
        );
        this.layersWindow.window.addListener("show", function () {
          ui.fireEvent(new m.mxEventObject("layers"));
        });
        this.layersWindow.window.addListener("hide", function () {
          ui.fireEvent(new m.mxEventObject("layers"));
        });
        this.layersWindow.window.setVisible(true);
        ui.fireEvent(new m.mxEventObject("layers"));

        this.layersWindow.init();
      } else {
        this.layersWindow.window.setVisible(
          !this.layersWindow.window.isVisible(),
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+L",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return this.layersWindow != null && this.layersWindow.window.isVisible();
    }),
  );
  action = this.addAction(
    "formatPanel",
    m.mxUtils.bind(this, function () {
      ui.toggleFormatPanel();
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+P",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return ui.formatWidth > 0;
    }),
  );
  action = this.addAction(
    "outline",
    m.mxUtils.bind(this, function () {
      if (this.outlineWindow == null) {
        // LATER: Check layers window for initial placement
        this.outlineWindow = new OutlineWindow(
          ui,
          document.body.offsetWidth - 260,
          100,
          180,
          180,
        );
        this.outlineWindow.window.addListener("show", function () {
          ui.fireEvent(new m.mxEventObject("outline"));
        });
        this.outlineWindow.window.addListener("hide", function () {
          ui.fireEvent(new m.mxEventObject("outline"));
        });
        this.outlineWindow.window.setVisible(true);
        ui.fireEvent(new m.mxEventObject("outline"));
      } else {
        this.outlineWindow.window.setVisible(
          !this.outlineWindow.window.isVisible(),
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+O",
  );

  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return (
        this.outlineWindow != null && this.outlineWindow.window.isVisible()
      );
    }),
  );
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.addAction = function (
  key,
  funct,
  enabled,
  iconCls,
  shortcut,
) {
  var title;

  if (key.substring(key.length - 3) == "...") {
    key = key.substring(0, key.length - 3);
    title = m.mxResources.get(key) + "...";
  } else {
    title = m.mxResources.get(key);
  }

  return this.put(key, new Action(title, funct, enabled, iconCls, shortcut));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.put = function (name, action) {
  this.actions[name] = action;

  return action;
};

/**
 * Returns the action for the given name or null if no such action exists.
 */
Actions.prototype.get = function (name) {
  return this.actions[name];
};

/**
 * Constructs a new action for the given parameters.
 */
/*
function Action(label, funct, enabled, iconCls, shortcut) {
  m.mxEventSource.call(this);
  this.label = label;
  this.funct = this.createFunction(funct);
  this.enabled = enabled != null ? enabled : true;
  this.iconCls = iconCls;
  this.shortcut = shortcut;
  this.visible = true;
}
*/
export class Action extends m.mxEventSource {
  constructor(label, funct, enabled, iconCls, shortcut) {
    super();
    this.label = label;
    this.funct = this.createFunction(funct);
    this.enabled = enabled != null ? enabled : true;
    this.iconCls = iconCls;
    this.shortcut = shortcut;
    this.visible = true;
  }
} //class end

// Action inherits from mxEventSource
//m.mxUtils.extend(Action, m.mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.createFunction = function (funct) {
  return funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setEnabled = function (value) {
  if (this.enabled != value) {
    this.enabled = value;
    this.fireEvent(new m.mxEventObject("stateChanged"));
  }
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setToggleAction = function (value) {
  this.toggleAction = value;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setSelectedCallback = function (funct) {
  this.selectedCallback = funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isSelected = function () {
  return this.selectedCallback();
};
