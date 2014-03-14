var PP = PP || {};

PP.Constants = (function() {
    var host = window.location.host;

    var local = false;
    if(host.indexOf("localhost") != -1) {
        local = true;
    }

    var logoUrl = 'http://' + host + '/images/CityLogo.JPG';
    if(local) { logoUrl = "http://i.imgur.com/9xC2hiQ.jpg"; }

    return {
        BOUNDING_BOX : "-9222891.832889367,4212750.376909204,-9153945.633376136,4263045.941520849",
        DEFAULT_OPACITY : 0.9,
        GEOCODE_LOWERLEFT : { lat: 35.0, lng: -83.0 },
        GEOCODE_UPPERRIGHT: { lat: 36.0, lng: -82.0 },
        LOGO_URL : logoUrl
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

            getColorRamp: function() { return colorRamp }
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
            // Set the lat lng on the report
            report.setLatLng(latlng);

            fetchParcel(latlng, function(parcel) {
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
        var geoServerLayers =
            {
                layers : [
                    { "name"    : "Railways",
                      "id"      : "railways",
                      "layer"   : "coagis:ncdot_rail",
                      "details" : [
                          { "name" : "Mail Line", "color" : "#000000" },
                          { "name" : "Spur", "color" : "#000000" }
                      ]
                    },
                    { "name"    : "Asheville Regional Airport (AVL)",
                      "id"      : "airport",
                      "layer"   : "coagis:coa_airport_view",
                      "details" : []
                    },
                    { "name"    : "Zoning Districts",
                      "id"      : "districts",
                      "layer"   : "coagis:coa_districts_zoning",
                      "details" : [
                          { "name" : "CBD - Central Business District", color : "#B6B6B6" },
                          { "name" : "NCD - Neighborhood Corridor District", color : "#A06969" },
                          { "name" : "URD - Urban Residential District", color : "#4242FA" },
                          { "name" : "UP - Urban Place", color : "#3270B9" },
                          { "name" : "UV - Urban Village", color : "#9C32B9" },
                          { "name" : "RB - Regional Business", color : "#B93232" },
                          { "name" : "HB - Highway Business", color : "#FF3232" },
                          { "name" : "CBII - Community Business II", color : "#D684AD" },
                          { "name" : "CBI - Community Business", color : "#DEB0C9" },
                          { "name" : "NB - Neighborhood Business", color : "#FFCAEC" },
                          { "name" : "IND - Industrial", color : "#BDB6FE" },
                          { "name" : "CI - Commercial Industrial", color : "#D2CEFE" },
                          { "name" : "LI - Light Industrial", color : "#EDDEFE" },
                          { "name" : "INST - Institutional", color : "#32BAEA" },
                          { "name" : "OB - Office Business", color : "#32FFFF" },
                          { "name" : "O2 - Office 2", color : "#ABE2F4" },
                          { "name" : "OFFICE", color : "#CAF2F2" },
                          { "name" : "RIVER", color : "#5FB932" },
                          { "name" : "RESORT", color : "#ACEA32" },
                          { "name" : "HCU - Historic Conditional Use", color : "#DBFFCA" },
                          { "name" : "RM16 - High Density Multi-Family", color : "#EAAC32" },
                          { "name" : "RM8 - Medium Density Multi-Family", color : "#FFBA32" },
                          { "name" : "RM6 - Low Density Multi-Family", color : "#FBEE73" },
                          { "name" : "RS8 - High Density Single-Family", color : "#FFFF32" },
                          { "name" : "RS4 - Medium Density Single-Family", color : "#F1F3B2" },
                          { "name" : "RS2 - Low Density Single-Family", color : "#FFFFCA" }
                      ]
                    }
                ]
            };

        return {
            init : function() {
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
        var createModel = function() {
            var lat = '';
            var lng = '';

            // Options for 'Radius' studyAreaType
            // studyAreasOptions={"areaType":"RingBuffer","bufferUnits":"esriMiles","bufferRadii":[1,2,3]}

            // Options for 
            // studyAreasOptions={"areaType":"DriveTimeBufferBands","bufferUnits":"esriDriveTimeUnitsMinutes","bufferRadii":[3,5,7]}

            return {
                lat : 0.0,
                lng : 0.0,
                report : { },
                title : '',
                outputFormat : '',
                studyAreaType : '',
                reportType : '',
                ring1Radius : 0,
                useRing2 : false,
                ring2Radius : 0,
                useRing3 : false,
                ring3Radius : 0,
                driveTime1 : 0,
                useDriveTime2 : false,
                driveTime2 : 0,
                useDriveTime3 : false,
                driveTime3 : 0,

                isValid : function() {
                    var hasTitle = (title.length > 0);

                    var driveTimesValid = true;
                    if(studyArea == 'travel-time') {
                        // TODO: Check if drive times are valid
                        driveTimesValid = true; 
                    };

                    var radiiValid = true
                    if(studyArea == 'radius') {
                        // TODO: Check if radii are valid
                        radiiValid = true;
                    };
                },

                getQueryParams : function() {
                    // convert to query params

                    var studyAreas = 'studyAreas=[{"geometry":{"x":' + lng + ',"y":' + lat + '}}]';

                    // Subtitle? "subtitle": "Produced by Foo company"
                    var reportFields = 
                        'reportFields={"title": "' + this.title + 
                        'My Report", "logo": ' + PP.Constants.LOGO_URL + '}"';

                    return studyAreas + '&'
                           reportFields;
                }
            };
        };

        var model = { };

        var token = '';
        
        var getToken = function(callback) {
            $.when(
                $.getJSON('gt/generateToken')
            ).then(
                function(tokenJson) {
                    token = tokenJson.access_token;
                    callback();
                }
            );
        };

        var createReport = function() {
            var studyAreas = '[{"geometry":{"x":' + lng + ',"y":' + lat + '}}]';

            alert(JSON.stringify({
                'title' : title,
                'outputFormat' : outputFormat,
                'studyAreaType' : studyAreaType,
                'reportType' : reportType,
                'token' : token,
                'lat' : lat,
                'lng' : lng,
                'studyAreas' : studyAreas
            }));
        };

        var $report_title = {};
        var $report_output_format = {};
        var $report_study_area = {};
        var $createButton = {};

        var setUI = function() {
            
        };

        var setReport = function(report) {
            model.report = report;

            _.each($report_output_format, function(format) {
                $(format).attr('disabled', _.contains(report.formats, "xlsx"));
            });

            // {
            //     "reportID": "census2010_profile",
            //     "metadata": {
            //         "title": "2010 Census Profile",
            //         "categories": [
            //             "Summary Reports"
            //         ],
            //         "name": "2010 Census Profile",
            //         "type": "esriReportTemplateStandard",
            //         "boundaryVintage": "2010",
            //         "boundaryVintageDescription": "Data displayed and aggregated on these reports is based on Census 2010 boundaries.",
            //         "dataVintage": "2000,2010",
            //         "dataVintageDescription": "This report contains Census 2000 and 2010 data.",
            //         "keywords": "Households, Family, Population, Housing Units, Race, White, Black, Asian, Hispanic",
            //         "creationDate": "1355122800000",
            //         "lastRevisionDate": "1355468400000",
            //         "coverage": "US",
            //         "author": "Esri",
            //         "countries": "US",
            //         "dataset": "USA_ESRI_2013"
            //     },
            //     "headers": [
            //         "locationname",
            //         "address",
            //         "latitude",
            //         "areadesc2",
            //         "longitude",
            //         "reportstyle",
            //         "binarylogo",
            //         "logo",
            //         "title"
            //     ],
            //     "formats": [
            //         "pdf",
            //         "xlsx"
            //     ]
            // }
        };

        return {
            init : function() {
                $report_title = $('#report-title');
                $report_output_format = $('input:radio[name="report-output-format"]');
                $report_study_area = $('input:radio[name="report-study-area"]');
                
                // Bind model
                $report_title.on( "change", function() {
                    model.title = $( this ).val();
                });

                $report_output_format.change(function() {
                    model.outputFormat = $(this).val();
                });

                $report_study_area.change(function() {
                    model.studyAreaType = $(this).val();
                });

                // Validation
                $('#create-report-button').on('click', createReport);

                // Report catalog
                $.when(
                    $.getJSON("gt/esriReportCatalog")
                ).then(
                    function(catalog) {
                        var $report_list = $('#report-list');

                        var $activeListing = {};
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
                                    console.log("CLICKED " + reportData.metadata.name + ", " + reportData.description);
                                    $activeListing.removeClass("active");
                                    $(this).addClass("active");
                                    $activeListing = $(this);

                                    if(model.title == '') {
                                        $report_title.attr("placeholder", reportData.metadata.name);
                                    }
                                    setReport(reportData);
                                });

                                if(i == 0) {
                                    $activeListing = $listing;
                                    $listing.addClass("active");
                                    if(model.title == '') {
                                        $report_title.attr("placeholder", reportData.metadata.name);
                                    }
                                    setReport(reportData);
                                }
                            })();
                        };
                    }
                );
            },
            
            setLatLng : function(latlng) {
                // Reset the model
                model = createModel();
                setUI();

                model.lat = latlng.lat;
                model.lng = latlng.lng;
            }
        };
    })();

    var UI = (function() {

        var $sidebar = {};
        var $allFactorsPanel = {};
        var $manageFactorsBtn = {};
        var $toolLegend = {};

        var cacheElements = function () {
            // Panels
            $sidebar           = $('#sidebar');
            $allFactorsPanel   = $('.all-factors');

            // Buttons
            $manageFactorsBtn  = $('.manage-factors-btn');
            $toolLegend        = $('.tool-legend');
        };

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
            var $container = $allFactorsPanel.append(allFactorsTemplate(model));
        };

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

        var toggleLegend = function(e) {
            $(this).toggleClass('active');
            $('#tool-legend-popover').toggleClass('in');
        };

        var toggleLegendSection = function() {
            $(this).toggleClass('active').find('.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
            $(this).siblings('ul').toggleClass('collapsed');
        };

        var toggleActiveReportType = function() {
            $('.list-group-item').removeClass('active');
            $(this).toggleClass('active');
        };

        var toggleReportArea = function() {
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

        var updateOpacity = function(e) {
            weightedOverlay.setOpacity(e.value / 100.0);
        };

        var bindEvents = function () {
            var $content           = $('.content');
            var $toggleSidebar     = $('#toggle-sidebar');
            var $scenarioSelect    = $('#scenario-select');
            var $opacitySlider     = $('.opacity-slider');
            var $legendPopover     = $('#tool-legend-popover');
            var $reportType        = $('.list-group-item');
            var $reportArea        = $('#report-study-area');

            // Panels
            $sidebar.on('click', '.manage-factors-btn', toggleFactorsPanel);
            $toggleSidebar.on('click', toggleSidebar);

            // Inputs
            $scenarioSelect.on('change', updateScenario);
            $opacitySlider.slider('setValue', PP.Constants.DEFAULT_OPACITY * 100).on('slide', updateOpacity);
            $sidebar.on('click', '.collapse-arrow', toggleAllFactorsList);
            $reportType.on('click', toggleActiveReportType);
            $reportArea.on('click', 'label', toggleReportArea);

            $toolLegend.on('click', toggleLegend);
            $legendPopover.on('click', '.collapse-arrow', toggleLegendSection);
        };
        
        return {
            init : function() {
                cacheElements();
                loadFactors();
                loadAllFactors();
                bindEvents();
            }
        };
    })();

    var init = function () {
        $.when(
            $.getJSON('json/layers.json'),
            $.getJSON('json/categories.json')
        ).then(
            $.proxy(
                function(factorsJson, categoriesJson) {
                    model.initialize(factorsJson[0].layers,categoriesJson[0].categories);
                    UI.init();
                    initMap();
                    parcelDetails.init();
                    legend.init();
                    weightedOverlay.init();
                    colorRamps.init();
                    findAddress.init();
                    report.init();
                    model.notifyChange();
                }, this),
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
