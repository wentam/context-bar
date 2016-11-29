var contextBarItem;
var contextBar;

(function ($) {
  // -- contextBarItem --
  contextBarItem = function(name) {
    this.name = name;
    this.region = [[0,0],[100,0],[100,100],[0,100]];
  }

  contextBarItem.prototype.setRegion = function(left, right) {
    this.regionLeft = left;
    this.regionRight = right;

    // if we're already part of a context bar, us changing means we need to update the bar
    if (this.isAdded == 1) {
      this.parentContextBar.update();
    }
  }

  // -- contextBar --
  contextBar = function(contextBarElem) {
    this.contextBarElem = contextBarElem;
    this.items = [];
  }

  contextBar.prototype.update = function() {
    var cbBottom = this.contextBarElem.offset().top+this.contextBarElem.height();

    $.each(this.items, function(i, item) {
      // CONFUSION WARNING: this is html, so a lower Y value is higher up the page

      // figure out which two vertices we are between, and the x-axis value the edge resides at at our location
      var left = 0;
      var width = 0;

      // TODO: we do lots of duplicate stuff for left then right. should be refactored.

      // if we are below the last vertex, item shouldn't exist on the bar -- 0 width
      if (cbBottom > item.regionLeft[item.regionLeft.length-1][1] ||
          cbBottom > item.regionRight[item.regionRight.length-1][1]) {
        left = 0;
        width = 0;
      } else {
        // We are at a position such that the item should exist on the bar.

        // find the lowest vertex that cbBottom is at or below
        var leftAboveVertexIndex = -1;
        var rightAboveVertexIndex = -1;

        var lowesty = -1;
        $.each(item.regionLeft, function(i, vertex) {
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
        $.each(item.regionRight, function(i, vertex) {
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
        if (cbBottom == item.regionLeft[leftAboveVertexIndex][1]) {
          left = item.regionLeft[leftAboveVertexIndex][0];
        } else {
          var aboveVertexX = item.regionLeft[leftAboveVertexIndex][0];
          var aboveVertexY = item.regionLeft[leftAboveVertexIndex][1];

          var belowVertexX = item.regionLeft[leftAboveVertexIndex+1][0];
          var belowVertexY = item.regionLeft[leftAboveVertexIndex+1][1];

          var downFromThisVertex = cbBottom-aboveVertexY;
          var travelMultiplier = downFromThisVertex/(belowVertexY-aboveVertexY);

          var offsetFromThisVertex = (belowVertexX-aboveVertexX)*travelMultiplier;
          left = aboveVertexX+offsetFromThisVertex;
        }

        if (cbBottom == item.regionRight[rightAboveVertexIndex][1]) {
          width = item.regionRight[rightAboveVertexIndex][0]-left;
        } else {
          var aboveVertexX = item.regionRight[rightAboveVertexIndex][0];
          var aboveVertexY = item.regionRight[rightAboveVertexIndex][1];

          var belowVertexX = item.regionRight[rightAboveVertexIndex+1][0];
          var belowVertexY = item.regionRight[rightAboveVertexIndex+1][1];

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
    item.elem = $('<div style="position: absolute;" class="contextBarItem">'+item.name+'</div>').appendTo(this.contextBarElem);
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
