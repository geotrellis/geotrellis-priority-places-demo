define([], function() {
  var map = {};

  var viewCoords = [35.576917,-82.55275];

  var getLayer = function(url,attrib) {
      return L.tileLayer(url, { maxZoom: 18, attribution: attrib });
  };

  var Layers = {
      stamen: { 
          toner:  'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',   
          terrain: 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png',
          watercolor: 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png',
          attrib: 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design'
      },
      mapBox: {
          azavea:     'http://{s}.tiles.mapbox.com/v3/azavea.map-zbompf85/{z}/{x}/{y}.png',
          wnyc:       'http://{s}.tiles.mapbox.com/v3/jkeefe.map-id6ukiaw/{z}/{x}/{y}.png',
          worldGlass:     'http://{s}.tiles.mapbox.com/v3/mapbox.world-glass/{z}/{x}/{y}.png',
          worldBlank:  'http://{s}.tiles.mapbox.com/v3/mapbox.world-blank-light/{z}/{x}/{y}.png',
          worldLight: 'http://{s}.tiles.mapbox.com/v3/mapbox.world-light/{z}/{x}/{y}.png',
          attrib: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">MapBox</a>'
      }
  };

  var selected = getLayer(Layers.mapBox.azavea,Layers.mapBox.attrib);

  var baseLayers = {
      "Azavea" : selected,
      "WNYC" : getLayer(Layers.mapBox.wnyc,Layers.mapBox.attrib),
      "World Light" : getLayer(Layers.mapBox.worldLight,Layers.mapBox.attrib),
      "Terrain" : getLayer(Layers.stamen.terrain,Layers.stamen.attrib),
      "Watercolor" : getLayer(Layers.stamen.watercolor,Layers.stamen.attrib),
      "Toner" : getLayer(Layers.stamen.toner,Layers.stamen.attrib),
      "Glass" : getLayer(Layers.mapBox.worldGlass,Layers.mapBox.attrib),
      "Blank" : getLayer(Layers.mapBox.worldBlank,Layers.mapBox.attrib)
  };

  map = L.map('map').setView(viewCoords, 12);
  selected.addTo(map);

  map.lc = L.control.layers(baseLayers).addTo(map);

  $('#map').resize(function() {
      map.setView(map.getBounds(),map.getZoom());
  });

  var parcelLayer = 
      new L.TileLayer.WMS("http://tomcatgis.ashevillenc.gov/geoserver/wms", {
          layers: "coagis:bc_property",
          srs: "EPSG:2264",
          transparent: "true",
          format: "image/png"
      })

  parcelLayer.addTo(map);
  map.lc.addOverlay(parcelLayer, "Parcels");

  // Overview Map
  var overviewLayer = getLayer(Layers.mapBox.azavea,Layers.mapBox.attrib);
  var miniMap = new L.Control.MiniMap(overviewLayer).addTo(map);
  
  return map;
});