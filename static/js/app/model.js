define(
['text!json/layers.json', 'text!json/categories.json'], 
function(layers_json, categories_json){
  'use strict';
  var layers = $.parseJSON(layers_json).layers;
  var layersMap = 
      _.object(_.map(layers, function(layer) {
          return [layer.id, layer]
      }));

  var categories = 
      _.map($.parseJSON(categories_json).categories, function(category) {
          category.layers = 
              _.map(category.layers, function(layer) {
                  return layersMap[layer];
              });
          return category;
      });

  var weights = _.object(_.map(layers, function(layer) {
      return [layer.id, 0]
      }));

  // Setup default active layers.
  var activeLayers = _.map(layers, function(l) { return l.id; });
  var inactiveLayers = _.map(layers, function(l) { return l.id; });
  var colorRamp = "blue-to-red";
  
  var listeners = [];
  var notifyChange = function() { _.each(listeners, function(f) { f(); }); }

  return {
    notifyChange: notifyChange,                    
    onChange : function(f) {
        listeners.push(f);
    },
    getLayers: function() { return layers; },
    addActiveLayer: function(layer,weight) {
        if(!_.contains(activeLayers,layer.id)) {
            activeLayers.push(layer.id);
            inactiveLayers.push(layer.id);
            notifyChange();
        };
    },
    removeActiveLayer: function(layer) {
        if(_.contains(activeLayers,layer.id)) {
            var i = activeLayers.indexOf(layer.id);
            activeLayers.splice(i,1);
            inactiveLayers.splice(i,1);
            notifyChange();
        };
    },
    toggleActiveLayer: function(layer,target) {
        activeLayers.length = 0;
        activeLayers.push(layer.id);
        notifyChange();
    },
    resetActiveLayer: function(layer) {
        $.extend(true, activeLayers, inactiveLayers);
        notifyChange();
    },
    updateLayerWeight: function(layer,weight) {
        if(weights[layer.id] != weight) {
            weights[layer.id] = weight;
            notifyChange();
        };
    },
    getActiveLayerWeights: function() {
        var activeWeights = {};
        _.forEach(activeLayers, function(id) {
            activeWeights[id] = weights[id];
        });
        return activeWeights;
    },
    setColorRamp: function(rampId) {
        if(colorRamp != rampId) {
            colorRamp = rampId;
            notifyChange();
        };
    },
    getColorRamp: function() { return colorRamp },
    getCategories: function() { return categories }
};
});