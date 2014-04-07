define(
["app/constants", "app/map", "app/layers-model", "app/color-ramps"],
function(constants, map, model, ramps){
  var layers = [];

  var layersToWeights = {};

  var breaks = null;

  var WOLayer = null;
  var opacity = constants.DEFAULT_OPACITY;
  var numBreaks = 10;

  var getLayerStrings = function() {
      var layers = model.getActiveLayerWeights();
      var ls = [];
      var ws = [];
      for(var id in layers) {
          if(layers.hasOwnProperty(id)) {
              if(layers[id] != 0) {
                  ls.push(id);
                  ws.push(layers[id]);
              };
          };
      };
      return {
          layers: ls.join(","),
          weights: ws.join(",")
      };
  };

  var update = function() {
    console.log("Updating WO");
          var layerStrings = getLayerStrings();
          if(layerStrings.layers == "") { 
              if (WOLayer) {
                  map.lc.removeLayer(WOLayer);
                  map.removeLayer(WOLayer);
                  WOLayer = null;
              }
              return;
          };

          $.ajax({
              url: 'gt/breaks',
              data: { 
                  'bbox' : constants.BOUNDING_BOX,
                  'cols' : 400,
                  'rows' : 400,
                  'layers' : layerStrings.layers, 
                  'weights' : layerStrings.weights,
                  'numBreaks': numBreaks 
              },
              dataType: "json",
              success: function(r) {
                  breaks = r.classBreaks;

                  if (WOLayer) {
                      map.lc.removeLayer(WOLayer);
                      map.removeLayer(WOLayer);
                  };

                  // Call again in case things have changed.
                  layerStrings = getLayerStrings();
                  if(layerStrings.layers == "") return;

                  WOLayer = new L.TileLayer.WMS("gt/wo", {
                      breaks: breaks,
                      //                                    transparent: true,
                      layers: layerStrings.layers,
                      weights: layerStrings.weights,
                      colorRamp: ramps.getColorRamp(),
                      //                                    mask: geoJson,
                      attribution: 'Azavea'
                  })

                  WOLayer.setOpacity(opacity);
                  WOLayer.addTo(map);
                  map.lc.addOverlay(WOLayer, "Suitability Map");
              }
          });
  };


  return {
    bind: function () {
        $(model).on('changed', update);
        $(ramps).on('changed', update);
        update();
      },
    setOpacity: function(v) {
      opacity = v;
      if(WOLayer) { WOLayer.setOpacity(opacity); }
      else { console.log("NO OVERLAY"); }
      },
    getOpacity: function() { return opacity ; },
    update: update
  };
});