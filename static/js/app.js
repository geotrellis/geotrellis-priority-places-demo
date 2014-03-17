var PP = PP || {};

PP.Constants = (function() {
    return {
        BOUNDING_BOX : "-9222891.832889367,4212750.376909204,-9153945.633376136,4263045.941520849",
        DEFAULT_OPACITY : 0.9,
        GEOCODE_LOWERLEFT : { lat: 35.0, lng: -83.0 },
        GEOCODE_UPPERRIGHT: { lat: 36.0, lng: -82.0 },
        LOGO_URL : "https://raw.github.com/mtedeschi/priority-places/master/static/images/CityLogo.png"
    };
})();

PP.Geocoder = (function(){
    var config = {
        'notFoundMessage' : 'Sorry, that address could not be found.',
        'messageHideDelay': 3000,
	'agsServerGeocode': 'gis.ashevillenc.gov', //ArcGIS  server name for geocoding
	'agsServerInstanceNameGeocode': 'COA_ArcGIS_Server', //ArcGIS  server instance for geocoding
	'geocdingLayerName': 'Buncombe_Address_WGS84', //geocoding service to use.        
	'mySRID': 4326 //your projection id
    };

    var getLatLong = function (someData, callback){
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
	    error:function(x,t,m){console.log('fail');}//updateResultsFail(t,'Error with transforming to WGS84!')
	});
    };

    var geocoder = null;
    return {
        geocode : function (address, callback) {
            $.when(
                $.getJSON("gt/geocode?address=" + address)
            ).then(
                callback,
                function(err) {
                    console.error('Error geocoding address "' + address + '": ', err.statusText, err);
                }
            );
        }
    };
})();

PP.Util = (function() {
    return {
        toggleToolActive : function(e) {
            $(this).toggleClass('active');
        }
    };
})();

PP.App = (function() {
    'use strict';
    var model = (function() {
        var listeners = [];

        var layers = [];
        var categories = [];
        var activeLayers = [];
        var inactiveLayers = [];
        var weights = {};
        var colorRamp = "blue-to-red";

        var notifyChange = function() { 
            _.each(listeners, function(f) { f(); });
        }

        return {
            notifyChange: notifyChange,
            
            onChange : function(f) {
                listeners.push(f);
            },

            initialize : function(ls,cats) {
                layers = ls;
                var layersMap = 
                    _.object(_.map(ls, function(layer) {
                        return [layer.id, layer]
                    }));

                categories = 
                    _.map(cats, function(category) {
                        category.layers = 
                            _.map(category.layers, function(layer) {
                                return layersMap[layer];
                            });
                        return category;
                    });

                weights =  _.object(_.map(layers, function(layer) {
                    return [layer.id, 0]
                }));
                
                // Setup default active layers.
                activeLayers = _.map(layers, function(l) { return l.id; });
                inactiveLayers = _.map(layers, function(l) { return l.id; });
            },

            getLayers: function() { return layers; },

            addActiveLayer: function(layer,weight) {
                if(!_.contains(activeLayers,layer.id)) {
                    activeLayers.push(layer.id);
                    inactiveLayers.push(layer.id);
                    notifyChange();
                };
            },
            removeActiveLayer: function(layer) {
                if(_.contains(activeLayers,layer.id)) {
                    var i = activeLayers.indexOf(layer.id);
                    activeLayers.splice(i,1);
                    inactiveLayers.splice(i,1);
                    notifyChange();
                };
            },
            toggleActiveLayer: function(layer,target) {
                activeLayers.length = 0;
                activeLayers.push(layer.id);
                notifyChange();
            },
            resetActiveLayer: function(layer) {
                $.extend(true, activeLayers, inactiveLayers);
                notifyChange();
            },

            updateLayerWeight: function(layer,weight) {
                if(weights[layer.id] != weight) {
                    weights[layer.id] = weight;
                    notifyChange();
                };
            },

            getActiveLayerWeights: function() {
                var activeWeights = {};
                _.forEach(activeLayers, function(id) {
                    activeWeights[id] = weights[id];
                });
                return activeWeights;
            },

            setColorRamp: function(rampId) {
                if(colorRamp != rampId) {
                    colorRamp = rampId;
                    notifyChange();
                };
            },

            getColorRamp: function() { return colorRamp },

            getCategories: function() { return categories }
        };
    })();

    var map = {};
    var initMap = function () {
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

        map = L.map('map').setView(viewCoords, 11);
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
    };

    var weightedOverlay = (function() {
        var layers = [];

        var layersToWeights = {}

        var breaks = null;

        var WOLayer = null;
        var opacity = PP.Constants.DEFAULT_OPACITY;
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
                        'bbox' : PP.Constants.BOUNDING_BOX,
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
                            colorRamp: model.getColorRamp(),
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
            init : function() {
                model.onChange(function () {
                    weightedOverlay.update();
                });
            },
            
            setOpacity: function(v) {
                opacity = v;
                if(WOLayer) { WOLayer.setOpacity(opacity); }
                else { console.log("NO OVERLAY"); };
                
            },

            getOpacity: function() { return opacity ; },

            update: update
        };
    })();

    var parcelDetails = (function() {
        var getFeatureUrl = function(lat,lng) {
            return "gt/getParcel?lat=" + lat + "&lng=" + lng;
        }

        var template = Handlebars.compile($('#parcel-details-template').html())
        var popup = L.popup();

        var parcelLayer = null; 

        var fetchParcel = function(latlng, cb) {
            $.when(
                $.getJSON(getFeatureUrl(latlng.lat, latlng.lng))
            ).then(
                $.proxy(
                    function(parcelJson) {
                        parcelLayer.clearLayers();
                        if(parcelJson.features.length > 0) {
                            parcelLayer.addData(parcelJson);
                            cb(parcelJson.features[0]);
                        }
                    }, this),
                function(err) {
                    console.error('Error retrieving parcel information: ', err.statusText, err);
                }
            );
        };
        
        var parcelDetails = function(latlng) {
            fetchParcel(latlng, function(parcel) {
                var address = [parcel.housenumber, parcel.streetname, parcel.streettype].join(' ');

                report.setLocation(latlng, address);

                var content = template(parcel.properties)
                map.panTo(latlng);
                popup.setLatLng(latlng).setContent(content).openOn(map);
            });
        }

        return {
            init : function() {
                map.on('click', function(e) { parcelDetails(e.latlng) });
                parcelLayer = L.geoJson().addTo(map);
            },
            popup: function(latlng) {
                parcelDetails(latlng);
            }
        }

    })();

    var legend = (function() {
        return {
            init : function(geoServerLayers) {
                var template = Handlebars.compile($('#legend-section-template').html())
                $('#legend-container').append(template(geoServerLayers));

                // Add the layers to the map and layer control
                _.each(geoServerLayers.layers, function(l) {
                    var mapLayer =     
                        new L.TileLayer.WMS("http://tomcatgis.ashevillenc.gov/geoserver/wms", {
                            layers: l.layer,
                            srs: "EPSG:2264",
                            transparent: "true",
                            format: "image/png"
                        })
                    map.lc.addOverlay(mapLayer, l.name);

                    $("#" + l.id + "-checkbox").change(function() {
                        if(this.checked) {
                            mapLayer.addTo(map);
                        } else {
                            map.removeLayer(mapLayer);
                        }
                    });
                })
            }
        }

    })();

    var colorRamps = (function() {
        var updateColorRamp = function() {
            var $toolColorRamps = $('.tool-ramp');
            var src = $(this).attr('src');
            var key = $(this).attr('id');

            $(this).siblings('img').removeClass('active');
            $(this).addClass('active');
            $toolColorRamps.find('img').attr('src', src);
            model.setColorRamp(key);
        };

        var colorRampTemplate = Handlebars.compile($('#colorramp-template').html());

        return { 
            init : function() {
                $.when(
                    $.getJSON('gt/colors')
                ).then(
                    $.proxy(
                        function(colorsJson) {
                            var activeColor = model.getColorRamp();
                            _.each(colorsJson.colors, function(color) {
                                if(color.key == activeColor) {
                                    color.active = true;
                                } else {
                                    color.active = false;
                                };
                            });
                            
                            var $toolColorRamps = $('.tool-ramp');

                            var options = { 
                                placement: 'bottom', 
                                container: '.content', 
                                html: true, 
                                content: colorRampTemplate(colorsJson)
                            };

                            $toolColorRamps.popover(options)
                                .on({'show.bs.popover': PP.Util.toggleToolActive,
                                     'hide.bs.popover': PP.Util.toggleToolActive});

                            $('.content').on('click', '.color-ramp-selector img', updateColorRamp);
                        })
                );
            }
        };
    })();

    var findAddress = (function() {

        var template = Handlebars.compile($('#find-address-template').html());

        var setAddress = function(results) {
            if (results.candidates.length != 0) {
                var location = results.candidates[0].location;
                parcelDetails.popup({ lat: location.y, lng: location.x });
            } else {
                alert("Address not found!");
            }
        };
        
        var onShowPopup = function(e) {
            var $input = $('#find-address-search')

            $('#find-address-go').on('click', function(e) { 
                PP.Geocoder.geocode($input.val(),setAddress);
            });

            $input.keypress(function (e) {
                if (e.which == 13) {
                    PP.Geocoder.geocode($input.val(),setAddress);
                }
            });
        };

        return {
            init : function() {
                var $toolFindAddress  = $('.tool-address-search');

                var findAddrOpts = { 
                    placement: 'bottom', 
                    container: '.content', 
                    html: true, 
                    content: template()
                };

                $toolFindAddress.popover(findAddrOpts)
                                .on({'show.bs.popover': PP.Util.toggleToolActive, 
                                     'hide.bs.popover': PP.Util.toggleToolActive,
                                     'shown.bs.popover': onShowPopup });
            }
        }
    })();

    var report = (function() {
        var reportModel = (function() {

            var listeners = [];

            return {
                lat : 0.0,
                lng : 0.0,
                address : "",
                report : { },
                title : '',
                outputFormat : 'pdf',
                studyAreaType : 'radius',
                ring1Radius : 1,
                useRing2 : true,
                ring2Radius : 3,
                useRing3 : true,
                ring3Radius : 5,
                driveTime1 : 3,
                useDriveTime2 : true,
                driveTime2 : 5,
                useDriveTime3 : true,
                driveTime3 : 7,

                notifyChange : function() { 
                    _.each(listeners, function(f) { f(); });
                },

                onChange : function(f) {
                    listeners.push(f);
                },

                reset : function() {
                    // Don't reset most members, user probably wants to carry selections over.
                    this.lat = 0.0;
                    this.lng = 0.0;
                    this.address = "";
                    this.title = '';
                },

                isValid : function() {
                    var hasTitle = (reportModel.title.length > 0);

                    var driveTimesValid = true;
                    if(reportModel.studyArea == 'travel-time') {
                        // TODO: Check if drive times are valid
                        driveTimesValid = true; 
                    };

                    var radiiValid = true
                    if(reportModel.studyArea == 'radius') {
                        // TODO: Check if radii are valid
                        radiiValid = true;
                    };

                    return hasTitle &&
                           driveTimesValid &&
                           radiiValid;
                },

                getQueryParams : function() {
                    var studyAreaOptions = {};
                    
                    if(this.studyAreaType == 'radius') {
                        studyAreaOptions.areaType = "RingBuffer";
                        studyAreaOptions.bufferUnits = "esriMiles";
                        var radii = [ this.ring1Radius ];
                        if(this.useRing2) { radii.push(this.ring2Radius); };
                        if(this.useRing3) { radii.push(this.ring3Radius); };
                        studyAreaOptions.bufferRadii = radii;

                    } else if (this.studyAreaType == 'travel-time') {
                        studyAreaOptions.areaType = "DriveTimeBufferBands";
                        studyAreaOptions.bufferUnits = "esriDriveTimeUnitsMinutes";
                        var radii = [ this.driveTime1 ];
                        if(this.useDriveTime2) { radii.push(this.driveTime2); };
                        if(this.useDriveTime3) { radii.push(this.driveTime3); };
                        studyAreaOptions.bufferRadii = radii;
                        
                    }
                    

                    var params = 
                        [   
                            'studyAreas=[{"geometry":{"x":' + this.lng + ',"y":' + this.lat + '}}]',
                            'report=' + this.report.reportID,
                            'f=bin',
                            'format=' + this.outputFormat,
                            'reportFields={"title": "' + this.title +
                                '", "subtitle": "' + this.report.metadata.name +  
                                '", "logo": "' + PP.Constants.LOGO_URL + 
                                '", "latitude" : "' + this.lat +
                                '", "longitude" : "' + this.lng +
                                '"}',
                            'studyAreasOptions=' + JSON.stringify(studyAreaOptions),
                            'useData={"sourceCountry":"US"}'
                        ];
                            
                    return params.join('&');
                }
            };
        })();

        var token = '';
        var expiresOn = '';
        
        var getToken = function(callback) {
            $.when(
                $.getJSON('gt/generateToken')
            ).then(
                function(tokenJson) {
                    token = tokenJson.access_token;
                    expiresOn = (new Date().getTime() / 1000) + (tokenJson.expires_in - 60); // Err on the side of safety by a minute.
                    callback();
                }
            );
        };

        var createReport = function() {
            var sendRequest = function() {
                var params = reportModel.getQueryParams() + '&token=' + token;
                var url = 'http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/CreateReport?' + params;
                window.location.href = url;
            };

            if(!token) {
                getToken(sendRequest);
            } else {
                if(expiresOn < (new Date().getTime() / 1000)) {
                    getToken(sendRequest);
                } else {
                    sendRequest();
                }
            }
        };

        var $report_title = {};
        var $report_output_format = {};
        var $report_study_area = {};
        var $create_report_button = {};
        var $radius_1 = {}
        var $radius_2 = {}
        var $radius_3 = {}
        var $traveltime_1 = {}
        var $traveltime_2 = {}
        var $traveltime_3 = {}


        var pushReportModelToUI = function() {
            $report_title.val(reportModel.title);
            $radius_1.val(reportModel.ring1Radius);
            $radius_2.val(reportModel.ring2Radius);
            $radius_3.val(reportModel.ring3Radius);
            $traveltime_1.val(reportModel.driveTime1);
            $traveltime_2.val(reportModel.driveTime2);
            $traveltime_3.val(reportModel.driveTime3);
            $('#report-study-area-radius-2-toggle').attr('checked', reportModel.useRing2);
            $('#report-study-area-radius-3-toggle').attr('checked', reportModel.useRing3);
            $('#report-study-area-traveltime-2-toggle').attr('checked', reportModel.useDriveTime2);
            $('#report-study-area-traveltime-3-toggle').attr('checked', reportModel.useDriveTime3);
        };

        var setReport = function(report) {
            reportModel.report = report;
            
            var existingFormat = null;
            var needsSelectionChanged = false;

            _.each($report_output_format, function(format) {
                var radio = $(format)
                if(! _.contains(report.formats, $(format).val())) {
                    if(radio.is(':checked')) { needsSelectionChanged = true; };
                    radio.attr('disabled', true);
                    radio.parent().addClass('disabled');
                } else {
                    radio.parent().removeClass('disabled');
                    if(!existingFormat) { existingFormat = $(format) }
                };
            });
            
            if(needsSelectionChanged) {
                if(existingFormat) { 
                    existingFormat.parent().addClass('active'); 
                    existingFormat.attr('checked', true);
                    reportModel.outputFormat = existingFormat.val();
                };
            };

            reportModel.notifyChange();
        };

        return {
            init : function() {
                $report_title = $('#report-title');
                $report_output_format = $('input:radio[name="report-output-format"]');
                $report_study_area = $('input:radio[name="report-study-area"]');
                $create_report_button = $('#create-report-button');
                $radius_1 = $('#report-study-area-radius-1')
                $radius_2 = $('#report-study-area-radius-2')
                $radius_3 = $('#report-study-area-radius-3')
                $traveltime_1 = $('#report-study-area-traveltime-1')
                $traveltime_2 = $('#report-study-area-traveltime-2')
                $traveltime_3 = $('#report-study-area-traveltime-3')

                $('#report-study-area').on('click', 'label', function() {
                    var id = $(this).attr('id');
                    if (id == 'report-study-area-radius') {
                        $('#report-study-area-traveltime-options').addClass('hidden');
                        $('#report-study-area-radius-options').toggleClass('hidden');
                    } else if (id == 'report-study-area-travel') {
                        $('#report-study-area-radius-options').addClass('hidden');
                        $('#report-study-area-traveltime-options').toggleClass('hidden');
                    } else {
                        $('#report-study-area-radius-options').addClass('hidden');
                        $('#report-study-area-traveltime-options').addClass('hidden');
                    }
                });

                // Bind reportModel
                $report_title.on( "input", function() {
                    reportModel.title = $( this ).val();
                    reportModel.notifyChange();
                });

                $report_output_format.change(function() {
                    reportModel.outputFormat = $(this).val();
                    reportModel.notifyChange();
                });

                $report_study_area.change(function() {
                    reportModel.studyAreaType = $(this).val();
                    reportModel.notifyChange();
                });

                $radius_1.on("input", function() {
                    reportModel.ring1Radius = $(this).val();
                    reportModel.notifyChange();
                });

                $radius_2.on("input", function() {
                    reportModel.ring2Radius = $(this).val();
                    reportModel.notifyChange();
                });

                $radius_3.on("input", function() {
                    reportModel.ring3Radius = $(this).val();
                    reportModel.notifyChange();
                });

                $('#report-study-area-radius-2-toggle').change(function() {
                    if($(this).is(':checked')) {
                        $radius_2.attr('disabled', false);
                        $radius_2.parent().removeClass('disabled');

                        reportModel.useRing2 = true;
                        reportModel.notifyChange();
                    } else {
                        $radius_2.attr('disabled', true);
                        $radius_2.parent().addClass('disabled');

                        reportModel.useRing2 = false;
                        reportModel.notifyChange();
                    }
                });

                $('#report-study-area-radius-3-toggle').change(function() {
                    if($(this).is(':checked')) {
                        $radius_3.attr('disabled', false);
                        $radius_3.parent().removeClass('disabled');

                        reportModel.useRing3 = true;
                        reportModel.notifyChange();
                    } else {
                        $radius_3.attr('disabled', true);
                        $radius_3.parent().addClass('disabled');

                        reportModel.useRing3 = false;
                        reportModel.notifyChange();
                    }
                });

                $traveltime_1.on("input", function() {
                    reportModel.driveTime1 = $(this).val();
                    reportModel.notifyChange();
                });

                $traveltime_2.on("input", function() {
                    reportModel.driveTime2 = $(this).val();
                    reportModel.notifyChange();
                });

                $traveltime_3.on("input", function() {
                    reportModel.driveTime3 = $(this).val();
                    reportModel.notifyChange();
                });

                $('#report-study-area-traveltime-2-toggle').change(function() {
                    if($(this).is(':checked')) {
                        $traveltime_2.attr('disabled', false);
                        $traveltime_2.parent().removeClass('disabled');

                        reportModel.useDriveTime2 = true;
                        reportModel.notifyChange();
                    } else {
                        $traveltime_2.attr('disabled', true);
                        $traveltime_2.parent().addClass('disabled');

                        reportModel.useDriveTime2 = false;
                        reportModel.notifyChange();
                    }
                });

                $('#report-study-area-traveltime-3-toggle').change(function() {
                    if($(this).is(':checked')) {
                        $traveltime_3.attr('disabled', false);
                        $traveltime_3.parent().removeClass('disabled');

                        reportModel.useDriveTime3 = true;
                        reportModel.notifyChange();
                    } else {
                        $traveltime_3.attr('disabled', true);
                        $traveltime_3.parent().addClass('disabled');

                        reportModel.useDriveTime3 = false;
                        reportModel.notifyChange();
                    }
                });

                reportModel.onChange(function() {
                    if(reportModel.isValid()) {
                        $create_report_button.attr('disabled', false);
                    } else {
                        $create_report_button.attr('disabled', true);
                    }
                });
                
                $create_report_button.on('click', createReport);

                // Populate list of reports.
                $.when(
                    $.getJSON("gt/esriReportCatalog")
                ).then(
                    function(catalog) {
                        var $report_list = $('#report-list');

                        var $activeListing = null;

                        var toggleActiveListing = function($newActive, reportData) {
                            if($activeListing) { $activeListing.removeClass('active'); };
                            $newActive.addClass("active");
                            $activeListing = $newActive;

                            if(reportModel.title == '') {
                                $report_title.attr("placeholder", reportData.metadata.name);
                            }

                            setReport(reportData);
                        };

                        for(var i = 0; i < catalog.reports.length; i++) {
                            (function() {
                                var reportData = catalog.reports[i];
                                var metadata = reportData.metadata;
                                
                                var descriptions = [];
                                
                                if(metadata.dataVintageDescription != "N/A") {
                                    descriptions.push(metadata.dataVintageDescription);
                                } 

                                if(metadata.boundaryVintageDescription != "N/A") {
                                    descriptions.push(metadata.boundaryVintageDescription);
                                }

                                reportData.description = descriptions.join(' ');

                                var listingTemplate = Handlebars.compile($('#report-listing-template').html());
                                $report_list.append(listingTemplate(reportData));
                                var $listing = $('#report-' + reportData.reportID, $report_list);

                                $listing.on("click", function() {
                                    toggleActiveListing($(this), reportData);
                                });

                                if(i == 0) {
                                    toggleActiveListing($listing, reportData);
                                }
                            })();
                        };
                    }
                );
            },
            
            setLocation : function(latlng, address) {
                reportModel.reset();

                reportModel.lat = latlng.lat;
                reportModel.lng = latlng.lng;
                reportModel.address = address
                reportModel.notifyChange();

                pushReportModelToUI();
            }
        };
    })();

    var factors = (function() {
        var $sidebar = {};
        var $allFactorsPanel = {};
        var $manageFactorsBtn = {};

        var loadFactors = function() {
            var $factorsList       = $('.factors');
            var factorTemplate = Handlebars.compile($('#factor-template').html());

            _.forEach(model.getLayers(), function(layer) {
                // Is there a better way to create the templates so that I can bind
                // the on('slide',...) event to close over the specific 'layer' var it is for?
                var $parentContainer = $factorsList.append(factorTemplate(layer));
                var $container = $parentContainer.find('#layer-'+layer.id);
                $container.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
                $container.find('.css-radio').on('change', function(e) {
                    model.toggleActiveLayer(layer,e.target);
                    toggleFactorRadio(e);
                });
                $sidebar.find('#all-radio').on('change', function(e) {
                    model.resetActiveLayer(layer);
                    toggleFactorRadio(e);
                });
                $container.find('.slider').slider().on('slide', function(e) {
                    model.updateLayerWeight(layer,e.value);
                    updateLayerWeight(e);
                });
                $container.find('.factor-remove').on('click', function(e) {
                    model.removeActiveLayer(layer);
                    removeFactor(e);
                });
            });
        };

        var loadAllFactors = function() {
            var allFactorsTemplate = Handlebars.compile($('#all-factors-template').html());
            var $container = 
                $allFactorsPanel.append(allFactorsTemplate({ categories : model.getCategories() }));
        };

        var loadScenarios = function(scenarios) {
            var $scenarios_select = $('#scenarios-select');
            
            _.each(scenarios, function(scenario) {
                var option = $("<option>" + scenario.name + "</option>");
                $scenarios_select.append(option);
            });
        }

        var removeFactor = function(e) {
            $(e.target).closest('.factor').remove();
        };

        var toggleSidebar = function() {
            $sidebar.toggleClass('active');
            $(this).toggleClass('active');
        };

        var toggleFactorsPanel = function() {
            $allFactorsPanel.toggleClass('hide-panel');
            $manageFactorsBtn.toggleClass('active');
        };

        var toggleFactorRadio = function(e) {
            $('.factor').removeClass('active');
            $(e.target).parent().toggleClass('active');
        };

        var toggleAllFactorsList = function() {
            $(this).find('.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
            $(this).parent().toggleClass('collapsed');
        };

        var updateLayerWeight = function(e) {
            // Sets the count with the slider's value -5 thru 5
            if (e.value === 0) {
                $(e.target).parent().prevAll('.css-radio').prop('disabled', true);
                $(e.target).parent().next('.count').addClass('zero').text(e.value);
            } else {
                $(e.target).parent().prevAll('.css-radio').prop('disabled', false);
                $(e.target).parent().next('.count').removeClass('zero').text(e.value);
            }
        };

        var updateScenario = function() {
            // TODO: Change scenarios with the dropdown list
        };

        return {
            init : function(scenarios) {
                // Panels
                $sidebar           = $('#sidebar');
                $allFactorsPanel   = $('.all-factors');

                loadFactors();
                loadAllFactors();
                loadScenarios(scenarios);

                var $toggleSidebar     = $('#toggle-sidebar');
                var $scenarioSelect    = $('#scenario-select');

                // Buttons
                $manageFactorsBtn  = $('.manage-factors-btn');

                // Panels
                $sidebar.on('click', '.manage-factors-btn', toggleFactorsPanel);
                $toggleSidebar.on('click', toggleSidebar);

                // Inputs
                $scenarioSelect.on('change', updateScenario);
                $sidebar.on('click', '.collapse-arrow', toggleAllFactorsList);
            }
        };
    })();

    var toolLegend = (function() {
        var toggleLegend = function(e) {
            $(this).toggleClass('active');
            $('#tool-legend-popover').toggleClass('in');
        };

        var toggleLegendSection = function() {
            $(this).toggleClass('active').find('.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
            $(this).siblings('ul').toggleClass('collapsed');
        };

        var updateOpacity = function(e) {
            weightedOverlay.setOpacity(e.value / 100.0);
        };

        return {
            init : function() {
                var $toolLegend = $('.tool-legend');

                var $opacitySlider     = $('.opacity-slider');
                var $legendPopover     = $('#tool-legend-popover');

                $toolLegend.on('click', toggleLegend);
                $opacitySlider.slider('setValue', PP.Constants.DEFAULT_OPACITY * 100)
                    .on('slide', updateOpacity);
                $legendPopover.on('click', '.collapse-arrow', toggleLegendSection);
            }
        };
    })();

    var init = function () {
        $.when(
            $.getJSON('json/layers.json'),
            $.getJSON('json/categories.json'),
            $.getJSON('json/scenarios.json'),
            $.getJSON('json/geoserverlayers.json')
        ).then(
            function(factorsJson, categoriesJson, scenariosJson, geoserverLayersJson) {
                model.initialize(factorsJson[0].layers,categoriesJson[0].categories);
                toolLegend.init();
                factors.init(scenariosJson[0].scenarios);
                initMap();
                parcelDetails.init();
                legend.init(geoserverLayersJson);
                weightedOverlay.init();
                colorRamps.init();
                findAddress.init();
                report.init();
                model.notifyChange();
            },
            function(err) {
                console.error('Error retrieving resources: ', err.statusText, err);
            }
        );
    };

    return {
        init: init
    };

})();

jQuery(function ($) {
    PP.App.init();
});
