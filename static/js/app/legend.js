define(
  ["app/map", 'text!json/geoserverlayers.json'], 
  function(map, geoserverlayers_json) {
    var geoServerLayers = $.parseJSON(geoserverlayers_json);
    var template = Handlebars.compile($('#legend-section-template').html());
    $('#legend-container').append(template(geoServerLayers));

    // Add the layers to the map and layer control
    _.each(geoServerLayers.layers, function(l) {
      var mapLayer =     
          new L.TileLayer.WMS("http://tomcatgis.ashevillenc.gov/geoserver/wms", {
            layers: l.layer,
            srs: "EPSG:2264",
            transparent: "true",
            format: "image/png"
          });
      map.lc.addOverlay(mapLayer, l.name);

      var $cb = $("#" + l.id + "-checkbox");
      $cb.change(function() {
        if(this.checked) {
          mapLayer.addTo(map);
        } else {
          map.removeLayer(mapLayer);
        }
      });
      map.on("overlayadd", function(e) {
        if (e.name === l.name){
          $cb.prop("checked", true);
        }
      });
      map.on("overlayremove", function(e) {
        if (e.name === l.name){
          $cb.prop("checked", false);
        }
      });
    });

  });
