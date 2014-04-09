/** Model for concept of a category */
define(
  ['text!json/categories.json', 'app/layers-model'],
  function(categories, layers) {
    categories = $.parseJSON(categories).categories;

    categories =
      _.object(_.map(categories, function(category) {
        category.activeLayerCount = 0;
        category.active = false;
        category.max = category.layers.length;
        category.status = 'empty'; // empty/half/full

        /** Layer changed, adjust the counts (this func closes over category) */
        var layerChanged = function (e, layer){
          if (layer.active) {
            category.activeLayerCount += 1;
          } else{
            category.activeLayerCount -= 1;
          }

          if (category.activeLayerCount == 0){
            category.status = 'empty';
            category.active = false;
          } else if(category.activeLayerCount == category.max) {
            category.status = 'full';
            category.active = true;
          } else{
            category.status = 'half';
            category.active = true;
          }

          $(category).trigger("changed");
        };

        //Link layers field to the layers model
        category.layers =
          _.map(category.layers, function (layerId) {
            var layer = layers.list[layerId];
            $(layer).on("changed-active", layerChanged);
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
