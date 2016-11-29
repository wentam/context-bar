var context_bar;

function init() {
  // Specify regions with polygonal lines. One for left, one for right.
  // Could potentially allow for curves to be specified
  // Potentially allow for region to be specified as element. Makes squares easy.
  context_bar = $('#context_bar_1').initContextBar();
  var cb_item_1 = new contextBarItem("Right item");
  cb_item_1.setRegion(
                      // left side
                      [[$('#item_1').offset().left, $('#item_1').offset().top],
                       [$('#item_1').offset().left, $('#item_1').offset().top+$('#item_1').height()]],

                      // right side
                      [[$(window).width(), $('#item_1').offset().top],
                       [$(window).width(), $('#item_1').offset().top+$('#item_1').height()]]);

  var cb_item_2 = new contextBarItem("Left item -- fun shape");
  var i2 = $('#item_2');
  var i22 = $('#item_2_p2');
  cb_item_2.setRegion(
                      // left side
                      [[0,i2.offset().top],[0,i22.offset().top+i22.height()]],

                      // right side
                      [[i2.width(),i2.offset().top],[i2.width(), i22.offset().top],
                       [i22.width(), i22.offset().top], [i22.width(), i22.offset().top+i22.height()]]);


  context_bar.addItem(cb_item_1);
  context_bar.addItem(cb_item_2);
}
