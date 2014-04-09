/**
 * This models layers and their current state info/active/weight
 * @returns: a map from layer.id to layer
 */
define(['text!json/layers.json'], function(layers){
  var module = {};
  layers = $.parseJSON(layers).layers;

  layers =
    _.object(_.map(layers, function(layer){
      layer.weight = 0;
      layer.counter = 0; //Need unique ids for <label> elements
      layer.active = false;
      layer.setActive = function(val) {
        if (val != layer.active) {
          layer.active = val;
          $(layer).trigger("changed-active", layer);
          $(module).trigger("changed");
        }
      };

      layer.setWeight = function (val) {
        if (val != layer.weight) {
          layer.weight = val;
          $(layer).trigger("changed-weight", layer);
          $(module).trigger("changed");
        }
      };

      return [layer.id, layer];
    }));

  var highlighted = null;
  var highlight = function(id) {
    if (id) {
      highlighted = layers[id];
      highlighted.highlighted = true;
    } else {
      if (highlighted) highlighted.highlighted = false;
      highlighted = null;
    }
    $(module).trigger("changed")
  };

  module['list'] = layers;
  module['highlight'] = highlight;
  module['getActiveLayerWeights'] = function() {
    var ret = {};
    if (highlighted) {
      ret[highlighted.id] =highlighted.weight;
    }else{
      _.forEach(layers, function(layer){
        if (layer.active && layer.weight != 0) ret[layer.id] = layer.weight;
      });
    }
    return ret;
  };

  return module;
});
