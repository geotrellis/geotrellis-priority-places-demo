L.QuickGeocode = {};
 
L.QuickGeocode.Result = function (x, y, label) {
    this.X = x;
    this.Y = y;
    this.Label = label;
};
 
L.Control.QuickGeocode = L.Control.extend({
 
    options: {
        position: 'topcenter'
    },
 
    initialize: function (options) {
        this._config = {};
        L.Util.extend(this.options, options);
        this.setConfig(options);
    },
 
    setConfig: function (options) {
        options = options || {};
        this._config = {
            'searchLabel': options.searchLabel || 'search your address here',
            'notFoundMessage' : options.notFoundMessage || 'Sorry, that address could not be found.',
            'messageHideDelay': options.messageHideDelay || 3000,
            'zoomLevel': options.zoomLevel || 16,
		    'agsServerGeocode': options.agsServerGeocode || 'gis.ashevillenc.gov', //ArcGIS  server name for geocoding
		    'agsServerInstanceNameGeocode': options.agsServerInstanceNameGeocode || 'COA_ArcGIS_Server', //ArcGIS  server instance for geocoding
		    'geocdingLayerName': options.geocdingLayerName || 'Buncombe_Address_WGS84', //geocoding service to use.        
		    'mySRID': options.mySRID  || 4326 //your projection id
        };
    },
 
    onAdd: function (map) {
        var $controlContainer = $(map._controlContainer);
 
        if ($controlContainer.children('.leaflet-top.leaflet-center').length == 0) {
            $controlContainer.append('<div class="leaflet-top leaflet-center"></div>');
            map._controlCorners.topcenter = $controlContainer.children('.leaflet-top.leaflet-center').first()[0];
        }
 
        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-quickgeocode');
 
        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-quickgeocode-qry';
        searchbox.type = 'text';
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;
 
        var msgbox = document.createElement('div');
        msgbox.id = 'leaflet-control-quickgeocode-msg';
        msgbox.className = 'leaflet-control-quickgeocode-msg';
        this._msgbox = msgbox;
 
        var resultslist = document.createElement('ul');
        resultslist.id = 'leaflet-control-quickgeocode-results';
        this._resultslist = resultslist;
 
        $(this._msgbox).append(this._resultslist);
        $(this._container).append(this._searchbox, this._msgbox);
 
        L.DomEvent
          .addListener(this._container, 'click', L.DomEvent.stop)
          .addListener(this._container, 'keypress', this._onKeyUp, this);
 
        L.DomEvent.disableClickPropagation(this._container);
 
        return this._container;
    },
 
    geocode: function (qry) {
		addressStr = qry;
		var urlStr = 'http://'+this._config.agsServerGeocode+'/'+this._config.agsServerInstanceNameGeocode+'/rest/services/'+this._config.geocdingLayerName+'/GeocodeServer/findAddressCandidates';
		var sData={f:"json",Street:addressStr};
 
		$.ajax({
		url: urlStr,
		dataType: "jsonp",
		data: sData,
		success: $.proxy(function(data) {
			if (data.candidates) {
			  it = data.candidates[0];
			  this.getLatLong({ label: it.address, value: it.address, x:it.location.x,y:it.location.y } );
			}
		},this)
		});
    },
	getLatLong:function (someData){
		xStr=someData.x;
		yStr=someData.y;
 
		var urlStr = 'http://'+this._config.agsServerGeocode+'/'+this._config.agsServerInstanceNameGeocode+'/rest/services/Geometry/GeometryServer/project';
		var aPt=JSON.stringify({geometryType:"esriGeometryPoint",geometries : [{"x":xStr,"y":yStr}]});
 
		var sData={f:"json",inSR:this._config.mySRID,outSR:4326,geometries:aPt};
 
		 $.ajax({
		    url: urlStr,
		    dataType: "jsonp",
		    data: sData,
		     crossDomain: true,
		     success:$.proxy(function(data){this.zoomMap(data,17,true);},this),
		     error:function(x,t,m){console.log('fail');}//updateResultsFail(t,'Error with transforming to WGS84!')
		 });
	},
	zoomMap :function(data,zlevel,isDrawPts){
		if(typeof(data) =='string'){var obj = JSON.parse(data);}else{var obj = data}
		this.clearMap();
		xStr=obj.geometries[0].x;
		yStr=obj.geometries[0].y;
		map.setView(new L.LatLng(yStr, xStr), zlevel);
		this._map.setView([yStr, xStr], this._config.zoomLevel, false);
		this._positionMarker = L.marker([yStr, xStr]).addTo(map);;
		//bounceOnAdd: true, bounceOnAddOptions: {duration: 500, height: 100}, bounceOnAddCallback: function() {console.log("done");} 
 
		var startPt = '[{"type": "Point","coordinates":['+xStr+','+yStr+']}]';
 
		if(isDrawPts){this.drawPoints(startPt);}
		return '';
	},	
	drawPoints:function(GJfeat){
 
		//this.clearMap();
		GJfeatObject=JSON.parse(GJfeat);
 
 
		var geojsonMarkerOptions = {
		  radius: 10,
		  fillColor: "#468847",
		  color: "#468847",
		  weight: 100,
		  opacity: 1,
		  //fillOpacity: 0.8
		};
 
		var gjPT = L.geoJson(GJfeatObject, {
		  pointToLayer: function (feature, latlng) {
		    return L.circleMarker(latlng, geojsonMarkerOptions);
		  }
		});
 
		gjPT.addTo(map);
		gjPT.bringToFront();
	},
	clearMap:function() {
 		try {
			map.removeLayer(this._positionMarker);
		}
		catch(e) {
			//do nothing....
		}
 
	},
   _onKeyUp: function (e) {
        var escapeKey = 27;
        var enterKey = 13;
 
        if (e.keyCode === escapeKey) {
            $('#leaflet-control-quickgeocode-qry').val('');
            $(this._map._container).focus();
        }
        else if (e.keyCode === enterKey) {
            this.geocode($('#leaflet-control-quickgeocode-qry').val());
        }
    }
 
});
