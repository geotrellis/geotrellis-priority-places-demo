define(function(){
  var config = {
    'notFoundMessage' : 'Sorry, that address could not be found.',
    'messageHideDelay': 3000,
    'agsServerGeocode': 'gis.ashevillenc.gov', //ArcGIS  server name for geocoding
    'agsServerInstanceNameGeocode': 'COA_ArcGIS_Server', //ArcGIS  server instance for geocoding
    'geocdingLayerName': 'Buncombe_Address_WGS84', //geocoding service to use.        
    'mySRID': 4326 //your projection id
  };

  var getLatLong = function(someData, callback) {
    xStr=someData.x;
    yStr=someData.y;
      
    var urlStr = 'http://'+config.agsServerGeocode+'/'+config.agsServerInstanceNameGeocode+'/rest/services/Geometry/GeometryServer/project';
    var aPt=JSON.stringify({geometryType:"esriGeometryPoint",geometries : [{"x":xStr,"y":yStr}]});
    var sData={f:"json",inSR:config.mySRID,outSR:4326,geometries:aPt};
      
    $.ajax({
      url: urlStr,
      dataType: "jsonp",
      data: sData,
      crossDomain: true,
      success:callback,//$.proxy(callback,this),
      error: function(x,t,m){console.log('fail');}//updateResultsFail(t,'Error with transforming to WGS84!')
    });
  };
  //var geocoder = null;
  return  function (address, callback) {
                $.when(
                    $.getJSON("gt/geocode?address=" + address)
                ).then(
                  callback,
                  function(err) {
                      console.error('Error geocoding address "' + address + '": ', err.statusText, err);
                  }
                );
              }
});