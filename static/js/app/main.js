requirejs.config({
    baseUrl: 'js/lib',
    paths: {
        json: '../../json',
        app: '../app'
    }
});

requirejs(
  [
    'app/model',
    'app/tool-legend',
    'app/factors',
    'app/map',
    'app/parcel-details',
    'app/legend',
    'app/weighted-overlay',
    'app/color-ramps',
    'app/find-address',
    'app/report',
    'text!json/scenarios.json',
    'text!json/geoserverlayers.json'
  ], 
  function(model, toolLegend, factors, map, parcelDetails, legend, weightedOverlay,colorRamps,findAddress,report,
    scenarios_json, geoserverlayers_json)  {
    var scenariosJson       = $.parseJSON(scenarios_json);
    var geoserverLayersJson = $.parseJSON(geoserverlayers_json);

    legend.init(geoserverLayersJson);    
    weightedOverlay.init();    
    colorRamps.init();
    findAddress.init();
    report.init();
    model.notifyChange();
  }
);
