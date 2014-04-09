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

    var timeoutId = null;

    var update = function() {
      timeoutId = null;
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

    //Events can accumulate fast, especially with group un-checks and scenario switching
    //  lets collapse update requests that fired very close in time.
    var scheduleUpdate = function() {
      if (timeoutId) { window.clearTimeout(timeoutId) }
      timeoutId = window.setTimeout(update, 100);
    };

    return {
      bind: function () {
        $(model).on('changed', scheduleUpdate);
        $(ramps).on('changed', scheduleUpdate);
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
