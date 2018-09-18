var contextBarItem;

// -- contextBarItem --
(function ($) {
  contextBarItem = function(name, height, color) {
    this.name = name;
    this.rightOffsets = {};
    this.leftOffsets = {};
    this.height = height;
    this.color = color;

    this.elem = $('<div class="contextBar_item"><div class="name">'+this.name+'</div></div>');
    this.leftEdgeElem = $('<div class="contextBar_itemLeftEdge"></div>');
    this.rightEdgeElem = $('<div class="contextBar_itemRightEdge"></div>');
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
      left.push(function(){return [Math.round(elem.offset().left), Math.round(elem.offset().top)]}.bind(elem));
      left.push(function(){return [Math.round(elem.offset().left), Math.round(elem.offset().top+elem.outerHeight())]}.bind(elem));

      right.push(function(){return [Math.round(elem.offset().left+elem.outerWidth()), Math.round(elem.offset().top)]}.bind(elem));
      right.push(function(){return [Math.round(elem.offset().left+elem.outerWidth()), Math.round(elem.offset().top+elem.outerHeight())]}.bind(elem));
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

      if (Math.round(y) >= Math.round(vertex[1])) {
        if (lowesty == -1) {
          lowesty = Math.round(vertex[1]);
          aboveVertexIndex = i;
        } else if (lowesty <= Math.round(vertex[1])) {
          lowesty = vertex[1];
          aboveVertexIndex = i;
        }
      }
    });

    if (aboveVertexIndex < 0) aboveVertexIndex = 0;

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
}(jQuery));
