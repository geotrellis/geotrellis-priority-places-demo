var PP = PP || {};

PP.Constants = {
    boundingBox : "-9222891.832889367,4212750.376909204,-9153945.633376136,4263045.941520849",
    defaultOpacity : 0.9
}

PP.App = (function() {
    'use strict';
    var model = (function() {
        var listeners = [];

        var layers = [];
        var categories = [];
        var activeLayers = [];
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
            },

            getLayers: function() { return layers; },

            addActiveLayer: function(layer,weight) {
                if(!_.contains(activeLayers,layer.id)) {
                    activeLayers.push(layer.id);
                    notifyChange();
                };
            },
            removeActiveLayer: function(layer) {
                if(_.contains(activeLayers,layer.id)) {
                    var i = activeLayers.indexOf(layer.id);
                    activeLayers.splice(i,1);
                    notifyChange();
                };
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

        var parcelUrl = "http://tomcatgis.ashevillenc.gov/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=coagis:bc_property&styles=&bbox=845633.391,625229.271,1055373.13,771961.267&width=512&height=358&srs=EPSG:2264&format=application/openlayers"
        var parcelLayer = 
            new L.TileLayer.WMS("http://tomcatgis.ashevillenc.gov/geoserver/wms", {
                layers: "coagis:bc_property",
                srs: "EPSG:2264",
                transparent: "true",
                format: "image/png"
            })

        parcelLayer.addTo(map);
        map.lc.addOverlay(parcelLayer);

        // var geoServerLayers =
        //     {
        //         "coagis:ncdot_rail" : {
        //             "Main Line" : "#7F7F7F 3 px line horizonal through center, #7F7F7F line slightly offset from right 3 px, vertical and 3/4 the length of the first line",
        //             "Spur" : "#A7A7A7 3 px line horizontal through center",
        //             },
        //         "coagis:coa_airport_view" : { }
        //         "coagis:coa_districts_zoning" : {
        //             "CBD - Central Business District" : "#B6B6B6",
        //             "NCD - Neighborhood Corridor District" : "#A06969",
        //             "URD - Urban Residential District" : "#4242FA",
        //             "UP - Urban Place" : "#3270B9",
        //             "UV - Urban Village" : "#9C32B9",
        //             "RB - Regional Business" : "#B93232",
        //             "HB - Highway Business" : "#FF3232",
        //             "CBII - Community Business II" : "#D684AD",
        //             "CBI - Community Business" : "#DEB0C9",
        //             "NB - Neighborhood Business" : "#FFCAEC",
        //             "IND - Industrial" : "#BDB6FE",
        //             "CI - Commercial Industrial" : "#D2CEFE",
        //             "LI - Light Industrial" : "#EDDEFE",
        //             "INST - Institutional" : "#32BAEA",
        //             "OB - Office Business" : "#32FFFF",
        //             "O2 - Office 2" : "#ABE2F4",
        //             "OFFICE" : "#CAF2F2",
        //             "RIVER" : "#5FB932",
        //             "RESORT" : "#ACEA32",
        //             "HCU - Historic Conditional Use" : "#DBFFCA",
        //             "RM16 - High Density Multi-Family" : "#EAAC32",
        //             "RM8 - Medium Density Multi-Family" : "#FFBA32",
        //             "RM6 - Low Density Multi-Family" : "#FBEE73",
        //             "RS8 - High Density Single-Family" : "#FFFF32",
        //             "RS4 - Medium Density Single-Family" : "#F1F3B2",
        //             "RS2 - Low Density Single-Family" : "#FFFFCA"
        //         }
        //     }

    };

    var weightedOverlay = (function() {
        var layers = [];

        var layersToWeights = {}

        var breaks = null;

        var WOLayer = null;
        var opacity = PP.Constants.defaultOpacity;
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
                        'bbox' : PP.Constants.boundingBox,
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

                        // var geoJson = "";
                        // var polygon = summary.getPolygon();
                        // if(polygon != null) {
                        //     geoJson = GJ.fromPolygon(polygon);
                        // }

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
        
        var parcelDetails = function(e) {
            fetchParcel(e.latlng, function(parcel) {
                var content = template(parcel.properties)
                popup.setLatLng(e.latlng).setContent(content).openOn(map);
            });
        }

        return {
            init : function() {
                map.on('click', parcelDetails);
                parcelLayer = L.geoJson().addTo(map);
            }
        }

    })();

    var UI = (function() {

        var $sidebar = {};
        var $allFactorsPanel = {};
        var $manageFactorsBtn = {};
        var $toolColorRamps = {};
        var $toolLegend = {};

        var cacheElements = function () {
            // Panels
            $sidebar           = $('#sidebar');
            $allFactorsPanel   = $('.all-factors');

            // Buttons
            $manageFactorsBtn  = $('.manage-factors-btn');
            $toolColorRamps    = $('.tool-ramp');
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
                $container.find('.slider').slider().on('slideStop', function(e) {
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

        var toggleSidebar = function() {
            $sidebar.toggleClass('active');
            $(this).toggleClass('active');
        };

        var toggleFactorsPanel = function() {
            $allFactorsPanel.toggleClass('hide-panel');
            $manageFactorsBtn.toggleClass('active');
        };

        var toggleFactorCheckbox = function() {
            $(this).parent().toggleClass('active');
        };

        var toggleAllFactorsList = function() {
            $(this).find('.glyphicon').toggleClass('glyphicon-collapse-up glyphicon-collapse-down');
            $(this).parent().toggleClass('collapsed');
        };

        var toggleToolActive = function(e) {
            $(this).toggleClass('active');
        };

        var toggleLegend = function(e) {
            $(this).toggleClass('active');
            $('#tool-legend-popover').toggleClass('in');
        };

        var updateLayerWeight = function(e) {
            // Sets the count with the slider's value -5 thru 5
            $(this).parent().next('.count').text(e.value);
        };

        var removeFactor = function() {
            $(this).parent().parent().remove();
        };

        var updateScenario = function() {
            // TODO: Change scenarios with the dropdown list
        };

        var updateOpacity = function(e) {
            // TODO: Change opacity for map layers
            // e.value gives you the value of the slider (0 - 100)
            weightedOverlay.setOpacity(e.value / 100.0);
        };

        var updateColorRamp = function() {
            var src = $(this).attr('src');

            $(this).siblings('img').removeClass('active');
            $(this).addClass('active');
            $toolColorRamps.find('img').attr('src', src);
        };

        var bindEvents = function () {
            var $colorRampHTML = '' +
                '<div class="color-ramp-selector">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/yellow-to-red-heatmap.png" class="active">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/bold-land-use-qualitative.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/muted-terrain-qualitative.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/light-to-dark-green.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/purple-to-dark-purple-to-white-heatmap.png">' +
                '</div>';

            var $findAddressHTML = '' +
                '<div class="find-address-container">' +
                '   <h4>Find Address</h4>' +
                '   <div class="input-group">' +
                '       <input type="text" class="form-control" id="find-address-search" placeholder="Search by address">' + 
                '       <span class="input-group-btn">' +
                '           <button class="btn btn-primary" type="button">Go!</button>' +
                '       </span>' +
                '   </div>' +
                '</div>';

            var $toolFindAddress    = $('.tool-address-search');
            var $content           = $('.content');
            var $toggleSidebar     = $('#toggle-sidebar');
            var $scenarioSelect    = $('#scenario-select');
            var $opacitySlider     = $('.opacity-slider');

            // Panels
            $sidebar.on('click', '.manage-factors-btn', toggleFactorsPanel);
            $toggleSidebar.on('click', toggleSidebar);

            // Inputs
            $sidebar.on('change', '.css-checkbox', toggleFactorCheckbox);
            $scenarioSelect.on('change', updateScenario);
            $opacitySlider.slider('setValue', PP.Constants.defaultOpacity * 100)
                          .on('slide', updateOpacity);
            $sidebar.on('click', '.collapse-arrow', toggleAllFactorsList);
            $toolColorRamps.popover({ placement: 'bottom', container: '.content', html: true, content: $colorRampHTML }).on({'show.bs.popover': toggleToolActive, 'hide.bs.popover': toggleToolActive});
            $toolFindAddress.popover({ placement: 'bottom', container: '.content', html: true, content: $findAddressHTML }).on({'show.bs.popover': toggleToolActive, 'hide.bs.popover': toggleToolActive});
            $toolLegend.on('click', toggleLegend);

            // Bootstrap UI
            $content.on('click', '.color-ramp-selector img', updateColorRamp);
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
                    weightedOverlay.init();
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
