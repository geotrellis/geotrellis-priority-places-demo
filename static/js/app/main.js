requirejs.config({
    baseUrl: 'js/lib',
    paths: {
        json: '../../json',
        gt: '../../gt',
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
    'app/bob',
    'app/layers-model'
  ], 
  function(model, toolLegend, factors, map, parcelDetails, legend, wo,colorRamps,findAddress,report, bob, layers){
    findAddress.bind('.tool-address-search');
    report.init();
    bob.bind($('#factor-categories'));
    wo.bind();
  }
);
