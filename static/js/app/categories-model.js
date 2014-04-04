/** Model for concept of a category */
  //TODO: I allow to activate all layers for a group
define(
['text!json/categories.json', 'app/layers-model'],
function(categories, layers) {
  categories = $.parseJSON(categories).categories;

  categories =
  _.object(_.map(categories, function(category) {
    category.activeLayerCount = 0;
    category.active = false;

    /** Layer changed, adjust the counts (this func closes over category) */
    var layerChanged = function (e, layer){
      if (category.activeLayerCount == 0){
        category.active = true; //Logic
        $(category).trigger("changed");
      }

      if (layer.active) {
        category.activeLayerCount += 1;
      }else{
        category.activeLayerCount -= 1;
      }

      if (category.activeLayerCount == 0){
        category.active = false; //Logic again
        $(category).trigger("changed");
      }
    };

    //Link layers field to the layers model
    category.layers =
      _.map(category.layers, function (layerId) {
        var layer = layers[layerId];
        $(layer).on("changed", layerChanged);
        return layer;
      });

    /** Set .active tag for every layer in category to val */
    category.setActive = function(val){
      _.forEach(category.layers, function(layer){layer.setActive(val)});
    };

    return [category.name, category];
  }));

  return categories;
});