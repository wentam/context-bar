var context_bar;

function init() {
  // init context bar
  context_bar = $('#context_bar_1').initContextBar();

  // set up items
  var cb_item_1 = new contextBarItem("Right item", '50px', '#777');
  cb_item_1.setRegionAsElems([$('#item_1')]);
  cb_item_1.offsetElemBottomLeft(0,50);

  var cb_item_2 = new contextBarItem("Left item -- fun shape", '50px', '#777');
  cb_item_2.setRegionAsElems([$('#item_2'),$('#item_2_p2')]);

  // add items to bar
  context_bar.addItem(cb_item_1);
  context_bar.addItem(cb_item_2);
}
