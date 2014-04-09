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
    'app/tool-legend',
    'app/map',
    'app/parcel-details',
    'app/legend',
    'app/weighted-overlay',
    'app/find-address',
    'app/report',
    'app/factors-ui'
  ],
  function(toolLegend, map, parcelDetails, legend, wo, findAddress,report, factorsUI){
    findAddress.bind('.tool-address-search');
    report.init();
    factorsUI.bind();
    wo.bind();
  }
);
