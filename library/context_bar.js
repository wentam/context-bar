var contextBarItem;
var contextBar;

(function ($) {
  // -- contextBarItem --
  contextBarItem = function(name) {
    this.name = name;
  }

  contextBarItem.prototype.setRegion = function(left, right) {
    this.regionLeft = left;
    this.regionRight = right;

    // if we're already part of a context bar, us changing means we need to update the bar
    if (this.isAdded == 1) {
      this.parentContextBar.update();
    }
  }

  contextBarItem.prototype.getLeftRegionVertex = function(index) {
      if (typeof this.regionLeft[index] == 'function') {
        return this.regionLeft[index]();
      } else {
        return this.regionLeft[index];
      }
  }

  contextBarItem.prototype.getRightRegionVertex = function(index) {
      if (typeof this.regionRight[index] == 'function') {
        return this.regionRight[index]();
      } else {
        return this.regionRight[index];
      }
  }

  // -- contextBar --
  contextBar = function(contextBarElem) {
    this.elem = contextBarElem;
    this.items = [];
  }

  contextBar.prototype.update = function() {
    var cbBottom = this.elem.offset().top+this.elem.height();

    $.each(this.items, function(i, item) {
      // CONFUSION WARNING: this is html, so a lower Y value is higher up the page

      // figure out which two vertices we are between, and the x-axis value the edge resides at at our location
      var left = 0;
      var width = 0;

      // TODO: we do lots of duplicate stuff for left then right. should be refactored.

      // if we are below the last vertex, item shouldn't exist on the bar -- 0 width
      if (cbBottom > item.getLeftRegionVertex(item.regionLeft.length-1)[1] ||
          cbBottom > item.getRightRegionVertex(item.regionRight.length-1)[1]) {
        left = 0;
        width = 0;
      } else {
        // We are at a position such that the item should exist on the bar.

        // find the lowest vertex that cbBottom is at or below
        var leftAboveVertexIndex = -1;
        var rightAboveVertexIndex = -1;

        var lowesty = -1;
        $.each(item.regionLeft, function(i, vert) {
          var vertex = item.getLeftRegionVertex(i);

          if (cbBottom >= vertex[1]) {
            if (lowesty == -1) {
              lowesty = vertex[1];
              leftAboveVertexIndex = i;
            } else if (lowesty <= vertex[1]) {
              lowesty = vertex[1];
              leftAboveVertexIndex = i;
            }
          }
        });

        lowesty = -1;
        $.each(item.regionRight, function(i, vert) {
          var vertex = item.getRightRegionVertex(i);


          if (cbBottom >= vertex[1]) {
            if (lowesty == -1) {
              lowesty = vertex[1];
              rightAboveVertexIndex = i;
            } else if (lowesty <= vertex[1]) {
              lowesty = vertex[1];
              rightAboveVertexIndex = i;
            }
          }
        });

        // if we're on top of a vertex, just use it's x value. otherwise, interpolate between above and below vertex
        if (cbBottom == item.getLeftRegionVertex(leftAboveVertexIndex)[1]) {
          left = item.getLeftRegionVertex(leftAboveVertexIndex)[0];
        } else {
          var aboveVertexX = item.getLeftRegionVertex(leftAboveVertexIndex)[0];
          var aboveVertexY = item.getLeftRegionVertex(leftAboveVertexIndex)[1];

          var belowVertexX = item.getLeftRegionVertex(leftAboveVertexIndex+1)[0];
          var belowVertexY = item.getLeftRegionVertex(leftAboveVertexIndex+1)[1];

          var downFromThisVertex = cbBottom-aboveVertexY;
          var travelMultiplier = downFromThisVertex/(belowVertexY-aboveVertexY);

          var offsetFromThisVertex = (belowVertexX-aboveVertexX)*travelMultiplier;
          left = aboveVertexX+offsetFromThisVertex;
        }

        if (cbBottom == item.getRightRegionVertex(rightAboveVertexIndex)[1]) {
          width = item.getRightRegionVertex(rightAboveVertexIndex)[0]-left;
        } else {
          var aboveVertexX = item.getRightRegionVertex(rightAboveVertexIndex)[0];
          var aboveVertexY = item.getRightRegionVertex(rightAboveVertexIndex)[1];

          var belowVertexX = item.getRightRegionVertex(rightAboveVertexIndex+1)[0];
          var belowVertexY = item.getRightRegionVertex(rightAboveVertexIndex+1)[1];

          var downFromThisVertex = cbBottom-aboveVertexY;
          var travelMultiplier = downFromThisVertex/(belowVertexY-aboveVertexY);

          var offsetFromThisVertex = (belowVertexX-aboveVertexX)*travelMultiplier;
          width = (aboveVertexX+offsetFromThisVertex)-left;
        }
      }

      item.elem.css('left',left);
      item.elem.css('width',width);

      if (width == 0) {
        item.elem.css('display','none');
      } else {
        item.elem.css('display','');
      }

    });
  }

  contextBar.prototype.addItem = function(item) {
    item.isAdded = 1;
    item.parentContextBar = this;
    item.elem = $('<div style="position: absolute;" class="contextBarItem">'+item.name+'</div>').appendTo(this.elem);
    this.items.push(item);
    this.update();
  }

  contextBar.prototype.removeItem = function(item) {
    item.isAdded = 0;
    item.parentContextBar = null;
    item.elem.remove();
    this.update();
  }

  contextBar.prototype.destroy = function() {
    var cb = this;
    $.each(this.items, function(i, item) {
      cb.removeItem(item);
    });

    $(window).off("resize load scroll", this.update);
  }

  // -- init --
  $.fn.initContextBar = function() {
    var cb = new contextBar(this);
    cb.update();
    $(window).on("resize load scroll", cb.update.bind(cb));
    return cb;
  }
}(jQuery));
