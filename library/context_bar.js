var contextBarItem;
var contextBar;

(function ($) {
  // -- private functions --
  var getRegionVertex = function(region, index) {
    if (typeof region[index] == 'function') {
      return region[index]();
    } else {
      return region[index];
    }
  }

  var getClosestVertexAbovePoint = function(region,y) {
    var aboveVertexIndex = -1;

    var lowesty = -1;
    $.each(region, function(i, vert) {
      var vertex = getRegionVertex(region, i);

      if (y >= vertex[1]) {
        if (lowesty == -1) {
          lowesty = vertex[1];
          aboveVertexIndex = i;
        } else if (lowesty <= vertex[1]) {
          lowesty = vertex[1];
          aboveVertexIndex = i;
        }
      }
    });

    return aboveVertexIndex;
  }

  var getXForYInRegion = function (region, y) {
    var aboveVertexIndex = getClosestVertexAbovePoint(region, y);

    // if we're on top of a vertex, just use it's x value. otherwise, interpolate between above and below vertex
    var x = 0;
    if (y == getRegionVertex(region, aboveVertexIndex)[1]) {
      x = getRegionVertex(region, aboveVertexIndex)[0];
    } else {
      var aboveVertexX = getRegionVertex(region, aboveVertexIndex)[0];
      var aboveVertexY = getRegionVertex(region, aboveVertexIndex)[1];

      var belowVertexX = getRegionVertex(region, aboveVertexIndex+1)[0];
      var belowVertexY = getRegionVertex(region, aboveVertexIndex+1)[1];

      var downFromAboveVertex = y-aboveVertexY;
      var totalHeightBetweenVertices = belowVertexY-aboveVertexY;
      var travelMultiplier = downFromAboveVertex/totalHeightBetweenVertices;

      var offsetFromThisVertex = (belowVertexX-aboveVertexX)*travelMultiplier;
      x = aboveVertexX+offsetFromThisVertex;
    }

    return x;
  }

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

  // -- contextBar --
  contextBar = function(contextBarElem) {
    this.elem = contextBarElem;
    this.items = [];
  }

  contextBar.prototype.update = function() {
    var cbBottom = this.elem.offset().top+this.elem.height();

    $.each(this.items, function(i, item) {
      // CONFUSION WARNING: this is html, so a lower Y value is higher up the page

      // figure out how far right and how wide we should be
      var left = 0;
      var width = 0;

      // if we are below the last vertex, item shouldn't exist on the bar -- 0 width
      if (cbBottom > getRegionVertex(item.regionLeft, item.regionLeft.length-1)[1] ||
      cbBottom > getRegionVertex(item.regionRight, item.regionRight.length-1)[1]) {
        left = 0;
        width = 0;
      } else {
        // We are at a position such that the item should exist on the bar.
        left = getXForYInRegion(item.regionLeft, cbBottom);
        width = getXForYInRegion(item.regionRight, cbBottom)-left;
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
