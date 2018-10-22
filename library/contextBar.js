var contextBar;

// -- contextBar --
(function ($) {
  var mode = Object.freeze({'vertical':0,'sidebyside':1});

  contextBar = function(contextBarElem) {
    this.elem = contextBarElem;
    this.items = [];
    this.mode = mode.sidebyside;
  }

  contextBar.prototype.setModeVertical = function() {
    this.mode = mode.vertical;
  }

  contextBar.prototype.setModeSideBySide = function() {
    this.mode = mode.sidebyside;
  }

  contextBar.prototype.update = function() {
    if (this.mode == mode.sidebyside) {
      var cbBottom = this.elem.offset().top+this.elem.outerHeight();

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

        // left
        var leftXYRatio = item.getXYRatioForYInRegion("left", cbBottom);
        if (leftXYRatio > 0) {
          item.leftEdgeElem.css('border-bottom','');
          item.leftEdgeElem.css('border-top',item.height+' solid '+item.color);
          var borderLeftWidth = parseInt(item.leftEdgeElem.css('border-top-width'),10)*leftXYRatio;
          item.leftEdgeElem.css('border-left',borderLeftWidth+'px solid transparent');
          item.leftEdgeElem.css('left',left-borderLeftWidth);
          item.leftEdgeElem.css('width',(width/2)+borderLeftWidth);
        } else {
          item.leftEdgeElem.css('border-top','');
          item.leftEdgeElem.css('border-bottom',item.height+' solid '+item.color);
          var borderLeftWidth = parseInt(item.leftEdgeElem.css('border-bottom-width'),10)*Math.abs(leftXYRatio);
          item.leftEdgeElem.css('border-left',borderLeftWidth+'px solid transparent');
          item.leftEdgeElem.css('left',left);
          item.leftEdgeElem.css('width',width/2);
          item.elem.css('left',left+borderLeftWidth);
        }

        var rightXYRatio = item.getXYRatioForYInRegion("right", cbBottom);
        if (rightXYRatio > 0) {
          item.rightEdgeElem.css('border-top','');
          item.rightEdgeElem.css('border-bottom',item.height+ ' solid '+item.color);
          var borderRightWidth = parseInt(item.rightEdgeElem.css('border-bottom-width'),10)*rightXYRatio;
          item.rightEdgeElem.css('border-right',borderRightWidth+'px solid transparent');
          item.rightEdgeElem.css('left',(left+(width/2))-borderRightWidth);
          item.rightEdgeElem.css('width',(width/2)+borderRightWidth);
        } else {
          item.rightEdgeElem.css('border-bottom','');
          item.rightEdgeElem.css('border-top',item.height+' solid '+item.color);
          var borderRightWidth = parseInt(item.rightEdgeElem.css('border-top-width'),10)*Math.abs(rightXYRatio);
          item.rightEdgeElem.css('border-right',borderRightWidth+'px solid transparent');
          item.rightEdgeElem.css('left',left+(width/2));
          item.rightEdgeElem.css('width',width/2);
        }
      });
    }
  }

  contextBar.prototype.addItem = function(item) {
    item.isAdded = 1;
    item.parentContextBar = this;

    item.elem.appendTo(this.elem);
    item.elem.css('position','absolute');
    item.elem.css('top',0);
    item.elem.css('z-index', 2);

    item.leftEdgeElem.appendTo(this.elem);
    item.leftEdgeElem.css('position','absolute');
    item.leftEdgeElem.css('z-index',1);
    item.leftEdgeElem.css('top',0);

    item.rightEdgeElem.appendTo(this.elem);
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
    cb.breakloop = true;
    $.each(this.items, function(i, item) {
      cb.removeItem(item);
    });

    $(window).off("resize load scroll", this.update_func);
  }

  var raf = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame;
  var $window = $(window);
  var lastScrollTop = $window.scrollTop();

  // -- init --
  $.fn.initContextBar = function() {
    var cb = new contextBar(this);
    cb.update_func = cb.update.bind(cb);
    cb.update();
    $(window).on("resize load", cb.update_func);

    if (raf) {
       loop();
    }

    function loop() {
      if (cb.breakloop) {
        return;
      }
      var scrollTop = $window.scrollTop();
      if (lastScrollTop === scrollTop) {
       raf(loop);
       return;
      } else {
       lastScrollTop = scrollTop;
       cb.update_func();

       raf(loop);
      }
    }
    return cb;
  }
}(jQuery));
