jQuery(function ($) {
    'use strict';

    // Bounding box of Asheville, NC in web mercator.
    var boundingBox = "-9222891.832889367,4212750.376909204,-9153945.633376136,4263045.941520849"

    var App = {
        model: (function() {
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
                        _.object(_.map(App.factors, function(layer) {
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
        })(),

        init: function () {
            $.when(
                $.getJSON('json/layers.json'),
                $.getJSON('json/categories.json')
            ).then(
                $.proxy(
                    function(factorsJson, categoriesJson) {
                        App.model.initialize(factorsJson[0].layers,categoriesJson[0].categories);
                        App.cacheElements();
                        App.loadFactors();
                        App.loadAllFactors();
                        App.bindEvents();
                        App.loadMap();
                        App.loadWeightedOverlay();
                        App.model.notifyChange();
                    }, this),
                function(err) {
                    console.error('Error retrieving resources: ', err.statusText, err);
                }
            );
        },

        cacheElements: function () {
            // Panels
            this.$content           = $('.content');
            this.$sidebar           = $('#sidebar');
            this.$toggleSidebar     = $('#toggle-sidebar');
            this.$allFactorsPanel   = $('.all-factors');
            this.$factorsList       = $('.factors');

            // Map
            this.$map               = $('#map');

            // Inputs
            this.$factorSlider      = $('.factor .slider');
            this.$opacitySlider     = $('.opacity-slider');
            this.$scenarioSelect    = $('#scenario-select');

            // Buttons
            this.$manageFactorsBtn  = $('.manage-factors-btn');
            this.$factorCheckbox    = $('.css-checkbox');
            this.$toolColorRamps    = $('.tool-ramp');
            this.$toolFindAddress   = $('.tool-address-search');

            // Templates
            this.factorTemplate = Handlebars.compile($('#factor-template').html());
            this.allFactorsTemplate = Handlebars.compile($('#all-factors-template').html());
        },

        bindEvents: function () {
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
                '   <button class="close">&times;</button>' +
                '   <h4>Find Address</h4>' +
                '   <div class="input-group">' +
                '       <input type="text" class="form-control" id="find-address-search" placeholder="Search by address">' + 
                '       <span class="input-group-btn">' +
                '           <button class="btn btn-primary" type="button">Go!</button>' +
                '       </span>' +
                '   </div>' +
                '</div>';

            // Panels
            this.$sidebar.on('click', '.manage-factors-btn', this.toggleFactorsPanel);
            this.$toggleSidebar.on('click', this.toggleSidebar);

            // Inputs
            this.$sidebar.on('change', '.css-checkbox', this.toggleFactorCheckbox);
            this.$scenarioSelect.on('change', this.updateScenario);
            this.$opacitySlider.slider().on('slide', this.updateOpacity);
            this.$sidebar.on('click', '.collapse-arrow', this.toggleAllFactorsList);
            this.$toolColorRamps.popover({ placement: 'bottom', container: '.content', html: true, content: $colorRampHTML });
            this.$toolFindAddress.popover({ placement: 'bottom', container: '.content', html: true, content: $findAddressHTML });

            // Bootstrap UI
            this.$content.on('click', '.color-ramp-selector img', this.updateColorRamp);
        },

        loadMap: function() {
            App.map = (function() {
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

                var m = L.map('map').setView(viewCoords, 11);
                selected.addTo(m);

                m.lc = L.control.layers(baseLayers).addTo(m);

                App.$map.resize(function() {
                    m.setView(m.getBounds(),m.getZoom());
                });

                var parcelUrl = "http://tomcatgis.ashevillenc.gov/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=coagis:bc_property&styles=&bbox=845633.391,625229.271,1055373.13,771961.267&width=512&height=358&srs=EPSG:2264&format=application/openlayers"
                var parcelLayer = 
                    new L.TileLayer.WMS("http://tomcatgis.ashevillenc.gov/geoserver/wms", {
                        layers: "coagis:bc_property",
                        srs: "EPSG:2264",
                        transparent: "true",
                        format: "image/png"
                    })

                parcelLayer.addTo(m);
                m.lc.addOverlay(parcelLayer);

                // Just a sample popup for parcel details
                var popup = L.popup();
                var parcelDetailContent = '' +
                '<div class="parcel-details-container">' +
                '    <div class="parcel-details-header">' +
                '        <h5>Sample Address</h5>' +
                '    </div>' +
                '    <div class="parcel-details-body">' +
                '        <table class="table table-hover">' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '            <tr>' +
                '                <td>Pin Num</td> <td>3252622353254</td>' +
                '            </tr>' +
                '        </table>' +
                '    </div>' +
                '</div>';

                function parcelDetails(e) {
                    popup.setLatLng(e.latlng).setContent(parcelDetailContent).openOn(m);
                }

                m.on('click', parcelDetails);

                var getFeatureInfo = "http://tomcatgis.ashevillenc.gov/geoserver/wms?REQUEST=GetFeatureInfo&EXCEPTIONS=application%2Fvnd.ogc.se_xml&BBOX=910345.362131%2C666979.970093%2C911977.553093%2C668119.303392&X=185&Y=118&INFO_FORMAT=text%2Fhtml&QUERY_LAYERS=coagis%3Abc_property&FEATURE_COUNT=50&Srs=EPSG%3A2264&Layers=coagis%3Abc_property&Styles=&WIDTH=510&HEIGHT=356&format=image%2Fpng"


                return m;
            })();
        },

        loadWeightedOverlay: function() {
            App.weightedOverlay = (function() {                
                var layers = [];

                var layersToWeights = {}

                var breaks = null;

                var WOLayer = null;
                var opacity = 0.9;
                var numBreaks = 10;

                var getLayerStrings = function() {
                    var layers = App.model.getActiveLayerWeights();
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
                    
                return {
                    setOpacity: function(v) {
                        opacity = v;
                        WOLayer.setOpacity(v);
                    },

                    getOpacity: function() { return opacity ; },

                    update: function() {
                        var layerStrings = getLayerStrings();
                        if(layerStrings.layers == "") { 
                            if (WOLayer) {
                                App.map.lc.removeLayer(WOLayer);
                                App.map.removeLayer(WOLayer);
                                WOLayer = null;
                            }
                            return;
                        };

                        $.ajax({
                            url: 'gt/breaks',
                            data: { 
                                'bbox' : boundingBox,
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
                                    App.map.lc.removeLayer(WOLayer);
                                    App.map.removeLayer(WOLayer);
                                }

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
                                    colorRamp: App.model.getColorRamp(),
//                                    mask: geoJson,
                                    attribution: 'Azavea'
                                })

                                WOLayer.setOpacity(opacity);
                                WOLayer.addTo(App.map);
                                App.map.lc.addOverlay(WOLayer, "Suitability Map");
                            }
                        });
                    }
                };
            })();

            App.model.onChange(function () {
                App.weightedOverlay.update();
            });

        },

        loadFactors: function() {
            _.forEach(App.model.getLayers(), function(layer) {
                // Is there a better way to create the templates so that I can bind
                // the on('slide',...) event to close over the specific 'layer' var it is for?
                var $parentContainer = App.$factorsList.append(App.factorTemplate(layer));
                var $container = $parentContainer.find('#layer-'+layer.id);
                $container.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
                $container.find('.slider').slider().on('slideStop', function(e) {
                    App.model.updateLayerWeight(layer,e.value);
                    App.updateLayerWeight(e);
                });
                $container.find('.factor-remove').on('click', function(e) {
                    App.model.removeActiveLayer(layer);
                    App.removeFactor(e);
                });
            });
        },

        loadAllFactors: function() {
            var $container = App.$allFactorsPanel.append(App.allFactorsTemplate(App.model));
        },

        toggleSidebar: function() {
            App.$sidebar.toggleClass('active');
            $(this).toggleClass('active');
        },

        toggleFactorsPanel: function() {
            App.$allFactorsPanel.toggleClass('hide-panel');
            App.$manageFactorsBtn.toggleClass('active');
        },

        toggleFactorCheckbox: function() {
            $(this).parent().toggleClass('active');
        },

        toggleAllFactorsList: function() {
            $(this).find('.glyphicon').toggleClass('glyphicon-collapse-up glyphicon-collapse-down');
            $(this).parent().toggleClass('collapsed');
        },

        updateLayerWeight: function(e) {
            // Sets the count with the slider's value -5 thru 5
            $(this).parent().next('.count').text(e.value);
        },

        removeFactor: function() {
            $(this).parent().parent().remove();
        },

        updateScenario: function() {
            // TO DO: Change scenarios with the dropdown list
        },

        updateOpacity: function(e) {
            // TO DO: Change opacity for map layers
            // e.value gives you the value of the slider (0 - 100)
            App.weightedOverlay.setOpacity(e.value);
        },

        updateColorRamp: function() {
            var src = $(this).attr('src');

            $(this).siblings('img').removeClass('active');
            $(this).addClass('active');
            App.$toolColorRamps.find('img').attr('src', src);
        }
    };

    App.init();
});
