define([], function() {
  var map = {};

  var viewCoords = [35.576917,-82.55275];
  var defaultZoom = 12;

  var esriAttrib = 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design';
  var stamenAttrib = 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design';


  var baseLayers = {
    "Esri Topo" : 
      L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "<span class='esri-attributions' style='line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;'>Esri</span>"}),

    "Esri Imagery" :
      L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "<span class='esri-attributions' style='line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;'>Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community</span>"}),

    "Esri Gray" : 
      L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "<span class='esri-attributions' style='line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;'>Esri, NAVTEQ, DeLorme</span>"}),

    "Stamen Toner" : L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', 
                                 { maxZoom: 18, attribution: stamenAttrib }),
    "Stamen Watercolor" : L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', 
                                      { maxZoom: 18, attribution: stamenAttrib }),
  };

  var selected = baseLayers["Esri Topo"];


  map = L.map('map').setView(viewCoords, defaultZoom);

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
  var overviewLayer = 
      L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', 
                  { maxZoom: 18, attribution: stamenAttrib })
  var miniMap = new L.Control.MiniMap(overviewLayer).addTo(map);

  //hook reset-zoom to "View Region" button
  $(".tool-region").click(function() {map.setView(viewCoords, defaultZoom)});
  
  return map;
});
