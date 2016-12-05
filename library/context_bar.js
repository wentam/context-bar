var contextBarItem;
var contextBar;

(function ($) {
  // -- contextBarItem --
  contextBarItem = function(name, height, color) {
    this.name = name;
    this.rightOffsets = {};
    this.leftOffsets = {};
    this.height = height;
    this.color = color;
  }

  contextBarItem.prototype.setRightVertexOffset = function(vertexIndex, offset) {
    this.rightOffsets[vertexIndex] = offset;
  }

  contextBarItem.prototype.setLeftVertexOffset = function(vertexIndex, offset) {
    this.leftOffsets[vertexIndex] = offset;
  }

  contextBarItem.prototype.offsetElemTopLeft = function(elemIndex, offset) {
    this.setLeftVertexOffset(elemIndex*2, offset);
  }

  contextBarItem.prototype.offsetElemBottomLeft = function(elemIndex, offset) {
    this.setLeftVertexOffset((elemIndex*2)+1, offset);
  }

  contextBarItem.prototype.offsetElemTopRight = function(elemIndex, offset) {
    this.setRightVertexOffset(elemIndex*2, offset);
  }

  contextBarItem.prototype.offsetElemBottomRight = function(elemIndex, offset) {
    this.setRightVertexOffset((elemIndex*2)+1, offset);
  }

  contextBarItem.prototype.setRegion = function(left, right) {
    this.regionLeft = left;
    this.regionRight = right;

    // if we're already part of a context bar, us changing means we need to update the bar
    if (this.isAdded == 1) {
      this.parentContextBar.update();
    }
  }

  contextBarItem.prototype.setRegionAsElems = function(elems) {
    var left = [];
    var right = [];

    $.each(elems, function (i, elem) {
      left.push(function(){return [elem.offset().left, elem.offset().top]}.bind(elem));
      left.push(function(){return [elem.offset().left, elem.offset().top+elem.height()]}.bind(elem));

      right.push(function(){return [elem.offset().left+elem.width(), elem.offset().top]}.bind(elem));
      right.push(function(){return [elem.offset().left+elem.width(), elem.offset().top+elem.height()]}.bind(elem));
    });

    return this.setRegion(left, right);
  }

  contextBarItem.prototype.getRegionVertex = function(regionId, index) {
    // figure out region and offset
    var region;
    var offset = 0;
    if (regionId == "left") {
      region = this.regionLeft;

      if (this.leftOffsets[index] != null) {
        if (typeof this.leftOffsets[index] == 'function') {
          offset = this.leftOffsets[index]();
        } else {
          offset = this.leftOffsets[index];
        }
      }
    } else {
      region = this.regionRight;

      if (this.rightOffsets[index] != null) {
        if (typeof this.rightOffsets[index] == 'function') {
          offset = this.rightOffsets[index]();
        } else {
          offset = this.rightOffsets[index];
        }
      }
    }

    // figure out result, apply offset
    var result;
    if (typeof region[index] == 'function') {
      result = region[index]();
    } else {
      result = region[index];
    }

    if (result == null) {
      return null;
    }

    result[0] += offset;

    return result;
  }

  contextBarItem.prototype.getClosestVertexAbovePoint = function(regionId,y) {
    var item = this;

    var region;
    if (regionId == "left") {
      region = this.regionLeft;
    } else {
      region = this.regionRight;
    }

    var aboveVertexIndex = -1;
    var lowesty = -1;

    $.each(region, function(i, vert) {
      var vertex = item.getRegionVertex(regionId, i);

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

  contextBarItem.prototype.getXYRatioForYInRegion = function (regionId, y) {
    var region;
    if (regionId == "left") {
      region = this.regionLeft;
    } else {
      region = this.regionRight;
    }

    var aboveVertexIndex = this.getClosestVertexAbovePoint(regionId, y);

    // if the vertex below doesn't exist, return 0
    if (aboveVertexIndex+1 >= region.length) {
      return 0;
    }

    // get above and below vertex
    var aboveVertex = this.getRegionVertex(regionId, aboveVertexIndex);
    var belowVertex = this.getRegionVertex(regionId, aboveVertexIndex+1);

    var xDiff = belowVertex[0]-aboveVertex[0];
    var yDiff = belowVertex[1]-aboveVertex[1];

    return xDiff/yDiff;
  }

  contextBarItem.prototype.getXForYInRegion = function (regionId, y) {
    var region;
    if (regionId == "left") {
      region = this.regionLeft;
    } else {
      region = this.regionRight;
    }

    var aboveVertexIndex = this.getClosestVertexAbovePoint(regionId, y);

    // if we're on top of a vertex, just use it's x value. otherwise, interpolate between above and below vertex
    var x = 0;
    if (y == this.getRegionVertex(regionId, aboveVertexIndex)[1]) {
      x = this.getRegionVertex(regionId, aboveVertexIndex)[0];
    } else {
      var aboveVertexX = this.getRegionVertex(regionId, aboveVertexIndex)[0];
      var aboveVertexY = this.getRegionVertex(regionId, aboveVertexIndex)[1];

      var belowVertexX = this.getRegionVertex(regionId, aboveVertexIndex+1)[0];
      var belowVertexY = this.getRegionVertex(regionId, aboveVertexIndex+1)[1];

      var downFromAboveVertex = y-aboveVertexY;
      var totalHeightBetweenVertices = belowVertexY-aboveVertexY;
      var travelMultiplier = downFromAboveVertex/totalHeightBetweenVertices;

      var offsetFromThisVertex = (belowVertexX-aboveVertexX)*travelMultiplier;
      x = aboveVertexX+offsetFromThisVertex;
    }

    return x;
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
      if (cbBottom > item.getRegionVertex("left", item.regionLeft.length-1)[1] ||
      cbBottom > item.getRegionVertex("right", item.regionRight.length-1)[1]) {
        left = 0;
        width = 0;
      } else {
        // We are at a position such that the item should exist on the bar.
        left = item.getXForYInRegion("left", cbBottom);
        width = item.getXForYInRegion("right", cbBottom)-left;
      }

      item.elem.css('left',left);
      item.elem.css('width',width);

      if (width == 0) {
        item.elem.css('display','none');
      } else {
        item.elem.css('display','');
      }

      // render left and right edge angles
      var widthReduce = 0;

      item.leftEdgeElem.css('width',width/2);
      item.rightEdgeElem.css('width',width/2);

      // left
      var leftXYRatio = item.getXYRatioForYInRegion("left", cbBottom);
      if (leftXYRatio > 0) {
        item.leftEdgeElem.css('border-bottom','');
        item.leftEdgeElem.css('border-top',item.height+' solid '+item.color);
        var borderLeftWidth = parseInt(item.leftEdgeElem.css('border-top-width'),10)*leftXYRatio;
        item.leftEdgeElem.css('border-left',borderLeftWidth+'px solid transparent');
        item.leftEdgeElem.css('left',left-borderLeftWidth);
      } else {
        item.leftEdgeElem.css('border-top','');
        item.leftEdgeElem.css('border-bottom',item.height+' solid '+item.color);
        var borderLeftWidth = parseInt(item.leftEdgeElem.css('border-bottom-width'),10)*Math.abs(leftXYRatio);
        item.leftEdgeElem.css('border-left',borderLeftWidth+'px solid transparent');
        item.leftEdgeElem.css('left',left);
        item.elem.css('left',left+borderLeftWidth);
        widthReduce += borderLeftWidth;
      }

      var rightXYRatio = item.getXYRatioForYInRegion("right", cbBottom);
      if (rightXYRatio > 0) {
        item.rightEdgeElem.css('border-top','');
        item.rightEdgeElem.css('border-bottom',item.height+ ' solid '+item.color);
        var borderRightWidth = parseInt(item.rightEdgeElem.css('border-bottom-width'),10)*rightXYRatio;
        item.rightEdgeElem.css('border-right',borderRightWidth+'px solid transparent');
        item.rightEdgeElem.css('left',(left+(width/2))-borderRightWidth);
        widthReduce += borderRightWidth;
      } else {
        item.rightEdgeElem.css('border-bottom','');
        item.rightEdgeElem.css('border-top',item.height+' solid '+item.color);
        var borderRightWidth = parseInt(item.rightEdgeElem.css('border-top-width'),10)*Math.abs(rightXYRatio);
        item.rightEdgeElem.css('border-right',borderRightWidth+'px solid transparent');
        item.rightEdgeElem.css('left',left+(width/2));
      }

      item.elem.css('width', width-widthReduce);
    });
  }

  contextBar.prototype.addItem = function(item) {
    item.isAdded = 1;
    item.parentContextBar = this;

    item.elem = $('<div class="contextBar_item"><div class="name">'+item.name+'</div></div>').appendTo(this.elem);
    item.elem.css('position','absolute');
    item.elem.css('top',0);
    item.elem.css('z-index', 2);

    item.leftEdgeElem = $('<div class="contextBar_itemLeftEdge"></div>').appendTo(this.elem);
    item.leftEdgeElem.css('position','absolute');
    item.leftEdgeElem.css('z-index',1);
    item.leftEdgeElem.css('top',0);

    item.rightEdgeElem = $('<div class="contextBar_itemRightEdge"></div>').appendTo(this.elem);
    item.rightEdgeElem.css('position','absolute');
    item.rightEdgeElem.css('z-index',1);
    item.rightEdgeElem.css('top',0);

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

    $(window).off("resize load scroll", this.update_func);
  }

  // -- init --
  $.fn.initContextBar = function() {
    var cb = new contextBar(this);
    cb.update_func = cb.update.bind(cb);
    cb.update();
    $(window).on("resize load scroll", cb.update_func);
    return cb;
  }
}(jQuery));
