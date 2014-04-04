/**
 * This models layers and their current state info/active/weight
 * @returns: a map from layer.id to layer
 */
define(['text!json/layers.json'], function(layers){
  layers = $.parseJSON(layers).layers

  layers =
  _.object(_.map(layers, function(layer){
    layer.weight = 0;
    layer.counter = 0; //Need unique ids for <label> elements
    layer.active = false;
    layer.setActive =
      function(val) {
        if (val != layer.active) {
          layer.active = val;
          $(layer).trigger("changed", layer);
        }else{
          layer.active = val;
        }
      };

    return [layer.id, layer];
  }));

  return layers;
});