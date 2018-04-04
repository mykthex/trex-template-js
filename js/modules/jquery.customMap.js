// Map jQuery Plugin
// A jQuery map plugin to create a map.

(function($) {
    var CustomMap = function(element, options) {
        this.mapWrapper = $(element);
        this.mapObj = null;
        this.map = null;

        // Default module configuration
        this.defaults = {
            key: '',
            customLoad: false,
            locked: false,
            loadAPI: true,
            markersSelector: '.marker',
            fitCenterMarkers: true,
            cluster: false,
            combine: false,
            zoomButtons: true,
            zommButtonsWrapper: '',
            lat: 0,
            lng: 0,
            zoom: 0,
            maxZoom: 18,
            minZoom: 0,
            styles: [],
            clusterOptions: [],
            markers: [],
            classes: {
                mapInnerWrapper: '',
                states: {
                    active: 'is-active'
                }
            },
            labels: {
                zoomIn: '',
                zoomInHidden: 'Zoomer la carte',
                zoomOut: '',
                zoomOutHidden: 'Dézoomer la carte',
            }
        };

        // Map
        this.map = null;

        // Merge default classes with window.project.classes
        this.classes = $.extend(true, this.defaults.classes, (window.project ? window.project.classes : {}));

        // Merge default labels with window.project.labels
        this.labels = $.extend(true, this.defaults.labels, (window.project ? window.project.labels : {}));

        // Merge default config with custom config
        this.config = $.extend(true, this.defaults, options || {});

        // Markers
        this.markers = {};

        // Info windows
        this.infoWindows = {};

        // Clustering
        this.markerCluster = null;

        // Current map zoom
        this.currentMapZoom = null;

        // Public methods
        this.publicMethods = {
            refreshMap: $.proxy(function(recenter, delay) {
                this.refreshMap(recenter);
            }, this),
            loadTheMap: $.proxy(function(markers) {
                if (markers != '') {
                    this.config.markers = markers;
                }
                this.init();
            }, this),
            resetAllInfoWindows: $.proxy(function() {
                this.resetAllInfoWindows();
            }, this),
            resetAllMarkers: $.proxy(function() {
                this.resetAllMarkers();
            }, this),
            resetMap: $.proxy(function() {
                this.resetMap();
            }, this),
            populateMap: $.proxy(function(markers, fitCenterMarkers) {
                if (markers != '') {
                    this.config.markers = markers;
                }
                this.populateMap(fitCenterMarkers);
            }, this),
            centerMarker: $.proxy(function(id, zoom) {
                this.centerMarker(id, zoom);
            }, this)
        };

        if (this.config.customLoad == false) {
            this.init();
        }
    };

    $.extend(CustomMap.prototype, {

        // Component initialization
        init: function() {
            // If api is loaded via the plugin or not
            if (this.config.loadAPI) {
                // Check if the API is already loaded
                if (!window.googleAPI) {
                    this.loadAPI();
                }
                // Global event after the Google Map API is loaded
                $(window).on('googleAPI', $.proxy(this.callback, this));
            } else {
                this.createMap();
            }
        },

        // Load the google map API
        loadAPI: function() {
            window.googleAPI = true;
            var otherParams = 'sensor=false';
            if (this.config.key != '') {
                otherParams = otherParams + '&key=' + this.config.key;
            }
            $.getScript('https://www.google.com/jsapi', $.proxy(function() {
                if (!window.google.maps) {
                    google.load('maps', '3', {
                        other_params: otherParams,
                        callback: $.proxy(function() {
                            // Trigger global event to initialize maps
                            $(window).trigger('googleAPI');
                        }, this)
                    });
                }
            }, this));
        },

        callback: function() {
            this.createMap();
        },

        // Prepare the MAP element, create it and call the function to add markers
        createMap: function() {
            this.mapWrapper.html('<div class="' + this.config.classes.mapInnerWrapper + '"></div>');
            this.$mapObj = this.mapWrapper.find('.' + this.config.classes.mapInnerWrapper);
            this.mapObj = this.$mapObj.get(0);
            this.$mapObj.css('height', '100%');

            this.bounds = new window.google.maps.LatLngBounds();
            this.map = new window.google.maps.Map(this.mapObj, {
                mapTypeId: 'roadmap',
                disableDefaultUI: true,
                center: new window.google.maps.LatLng(this.config.lat, this.config.lng),
                zoom: this.config.zoom,
                maxZoom: this.config.maxZoom,
                minZoom: this.config.minZoom,
                styles: this.config.styles
            });

            // Set zoom variable
            this.currentMapZoom = this.map.getZoom();

            // Marker clustering
            if (this.config.cluster === true) {
                var clusterOptions = this.config.clusterOptions;
                this.markerCluster = new MarkerClusterer(this.map, [], clusterOptions);
            }

            // Zoom buttons
            if (this.config.zoomButtons === true) {
                this.creatZoomButtons();
            }

            this.bindMapEvents();

            this.populateMap();
        },

        // Create zoom buttons et bind events
        creatZoomButtons: function() {
            var $buttonWrapper = $(this.config.zommButtonsWrapper);
            var zoomInButtonHtml = '<button type="button" class="custom-map-zoom-btn is-zoom-in">' +  this.labels.zoomIn + '<span class="visuallyhidden">' + this.labels.zoomInHidden +'</span></button>';
            var zoomOutButtonHtml = '<button type="button" class="custom-map-zoom-btn is-zoom-out">' +  this.labels.zoomOut + '<span class="visuallyhidden">' + this.labels.zoomOutHidden +'</span></button>';

            //Append buttons to given div
            $buttonWrapper.html(zoomInButtonHtml + zoomOutButtonHtml);

            // Bind events on buttons
            $('.custom-map-zoom-btn.is-zoom-in').on('click', $.proxy(function() {
                this.map.setZoom(this.map.getZoom() + 1);
            }, this));

            $('.custom-map-zoom-btn.is-zoom-out').on('click', $.proxy(function() {
                this.map.setZoom(this.map.getZoom() - 1);
            }, this));
        },

        // Reset map - removes markers, infowindows and clustering
        resetMap: function() {
            // Reset all info windows
            _.each(this.infoWindows, $.proxy(function(infoWindow) {
                infoWindow.setMap(null);
            }, this));

            // Reset all markers
            _.each(this.markers, $.proxy(function(marker) {
                if (marker != undefined) {
                    marker.setMap(null);
                    this.markerCluster.removeMarker(marker);
                }
            }, this));

            this.markers = {};
        },

        // Pupulate the maps with markers
        populateMap: function(fitCenterMarkers = true) {
            this.addMarkersJs();
            this.$htmlMarkers = $(this.config.markersSelector);
            this.config.fitCenterMarkers = fitCenterMarkers;

            if (this.$htmlMarkers.length > 0) {
                this.addMarkersHTML();
            }

            if (this.config.fitCenterMarkers === true) {
                this.fitCenterBounds();
            }

            if (this.config.locked === true) {
                this.lockMap();
            }
        },

        // Add markers via JS (config markers)
        addMarkersJs: function() {
            var length = this.config.markers.length;
            _.each(this.config.markers, $.proxy(function(marker) {
                marker.position = new window.google.maps.LatLng(marker.lat, marker.lng);
                this.addMarker(marker);

                if (length > 1 && this.config.fitCenterMarkers == true) {
                    this.bounds.extend(marker.position);
                    this.map.fitBounds(this.bounds);
                    // Set zoom variable
                    this.currentMapZoom = this.map.getZoom();
                }
            }, this));
        },

        // Add markers via HTML elements
        addMarkersHTML: function() {
            // Bind events for html markers hover
            this.bindHtmlMarkerEvents();

            // Look through each markers and put the HTML data into an object
            // Then call the addMarker function with the marker object
            _.each(this.$htmlMarkers, $.proxy(function(marker) {
                var markerElement = {};
                var $marker = $(marker);

                markerElement.position = new window.google.maps.LatLng($marker.attr('data-lat'), $marker.attr('data-lng'));

                // Set marker icon and (global or for this one only)
                if ($marker.attr('data-icon') != '' && $marker.attr('data-icon') != undefined) {
                    markerElement.icon = $marker.attr('data-icon');
                } else {
                    if (this.mapWrapper.attr('data-icon') != '' && this.mapWrapper.attr('data-icon') != undefined) {
                        markerElement.icon = this.mapWrapper.attr('data-icon');
                    } else {
                        markerElement.icon = '';
                    }
                }
                // Set marker icon hover (global or for this one only)
                if ($marker.attr('data-icon-hover') != '' && $marker.attr('data-icon-hover') != undefined) {
                    markerElement.iconHover = $marker.attr('data-icon-hover');
                } else {
                    if (this.mapWrapper.attr('data-icon-hover') != '' && this.mapWrapper.attr('data-icon-hover') != undefined) {
                        markerElement.iconHover = this.mapWrapper.attr('data-icon-hover');
                    } else {
                        markerElement.iconHover = '';
                    }
                }
                // Set marker width
                if ($marker.attr('data-icon-width') != '' && $marker.attr('data-icon-width') != undefined) {
                    markerElement.iconWidth = parseInt($marker.attr('data-icon-width'));
                } else {
                    if (this.mapWrapper.attr('data-icon-width') != '' && this.mapWrapper.attr('data-icon-width') != undefined) {
                        markerElement.iconWidth = parseInt(this.mapWrapper.attr('data-icon-width'));
                    } else {
                        markerElement.iconWidth = '';
                    }
                }
                // Set marker size
                if ($marker.attr('data-icon-height') != '' && $marker.attr('data-icon-height') != undefined) {
                    markerElement.iconHeight = parseInt($marker.attr('data-icon-height'));
                } else {
                    if (this.mapWrapper.attr('data-icon-height') != '' && this.mapWrapper.attr('data-icon-height') != undefined) {
                        markerElement.iconHeight = parseInt(this.mapWrapper.attr('data-icon-height'));
                    } else {
                        markerElement.iconHeight = '';
                    }
                }
                // Set other data
                markerElement.title = $marker.attr('data-title');
                markerElement.id = $marker.attr('data-id');
                markerElement.combine = $marker.attr('data-combine');
                markerElement.infoWindowContent = $marker.find('.marker-popup-content').html();

                // Combine elements on same lat/long if set
                if (this.config.combine == true) {
                    if (markerElement.combine != '') {
                        //this.markers[markerElement.combine].title += ' | ' + markerElement.title;
                        if (this.infoWindows[markerElement.combine].content.indexOf('<div class="info-window-combined">') == -1) {
                            this.infoWindows[markerElement.combine].content = '<div class="info-window-combined">' + this.infoWindows[markerElement.combine].content + '</div>'
                        }

                        this.infoWindows[markerElement.combine].content = this.infoWindows[markerElement.combine].content.substring(0, 34) + markerElement.infoWindowContent + this.infoWindows[markerElement.combine].content.substring(34);

                        this.markers[markerElement.combine].isCombined = true;

                        this.addMarker(markerElement);
                    } else {
                        this.addMarker(markerElement);
                    }
                } else {
                    this.addMarker(markerElement);
                }

                if (this.$htmlMarkers.length > 1 && this.config.fitCenterMarkers == true) {
                    this.bounds.extend(markerElement.position);
                    this.map.fitBounds(this.bounds);
                    // Set zoom variable
                    this.currentMapZoom = this.map.getZoom();
                }
            }, this));
        },

        // Add marker on map with it's info window
        // @param marker: object with one marker infos
        addMarker: function(marker) {
            var infoWindow = '';
            var icon = marker.icon;
            var iconHover = marker.iconHover;

            // Set icon with width and height if it's not empty or undefined
            if (marker.iconWidth !== '' && marker.iconWidth !== undefined &&
                marker.iconHeight !== '' && marker.iconHeight !== undefined &&
                marker.icon != '' && marker.icon != undefined &&
                marker.iconHover != '' && marker.iconHover != undefined) {

                icon = {
                    url: marker.icon,
                    scaledSize: new google.maps.Size(marker.iconWidth, marker.iconHeight)
                };
                iconHover = {
                    url: marker.iconHover,
                    scaledSize: new google.maps.Size(marker.iconWidth, marker.iconHeight)
                };
            }

            var markerObj = new window.google.maps.Marker({
                position: marker.position,
                map: this.map,
                icon: icon,
                iconDefault: icon,
                iconHover: iconHover,
                title: marker.title,
                customId: marker.id
            });

            // Add marker to the global array
            this.markers[marker.id] = markerObj;
            // Bind events for the marker
            this.bindMapsMarkerEvents(markerObj);
            // Add marker to cluster
            if (this.config.cluster === true && !marker.doNotCluster) {
                this.markerCluster.addMarker(markerObj);
            }

            //Add the info window if content not empty
            if (marker.infoWindowContent != '' && marker.infoWindowContent != null) {
                infoWindow = new InfoBubble({
                    content: marker.infoWindowContent,
                    borderRadius: 0,
                    disableAnimation: true,
                    hideCloseButton: true,
                    disableAutoPan: true,
                    borderWidth: 0,
                    backgroundColor: 'rgb(255,255,255)',
                    shadowStyle: 1,
                    maxWidth: 300,
                    arrowSize: 15,
                    padding: 0,
                    arrowStyle: 0
                });
                this.infoWindows[marker.id] = infoWindow;
                this.bindInfoWindowEvent(markerObj, infoWindow);
            }
        },

        // Bind info window on marker
        bindInfoWindowEvent: function(marker, infoWindow) {
            // Marker click event to open info window
            marker.addListener('click', $.proxy(function() {
                if (infoWindow.isOpen() == true) {
                    // Open the infowindow and activate the marker
                    infoWindow.close(this.map, marker);
                    marker.isClicked = false;
                    this.changeMarkerIcon(marker, 'default');
                    //$('[data-id="' + marker.customId + '"]').removeClass(this.config.classes.states.active);
                } else {
                    // Reset all info windows and markers
                    this.resetAllMarkers();
                    // Open the infowindow and activate the marker
                    infoWindow.open(this.map, marker);
                    this.map.panTo(marker.getPosition());
                    this.map.panBy(0, -100)
                    marker.isClicked = true;
                    this.changeMarkerIcon(marker, 'hover');
                    //$('[data-id="' + marker.customId + '"]').addClass(this.config.classes.states.active);
                }

            }, this));
            // Info window close click
            infoWindow.addListener('closeclick', $.proxy(function() {
                // Reset all markers
                _.each(this.markers, $.proxy(function(marker) {
                    if (marker != undefined) {
                        this.resetMarker(marker);
                    }
                }, this));
            }, this));
        },

        // Events for the map
        bindMapEvents: function() {
            // Cluster events
            if (this.config.combine == true && this.config.cluster == true) {
                google.maps.event.addListener(this.markerCluster, 'clusterclick', $.proxy(function(cluster) {
                    if (this.map.getZoom() < 16) {
                        var clusterCenter = cluster.center_;
                        this.map.setCenter(clusterCenter);
                        this.map.setZoom(this.map.getZoom() + 1);
                    } else {
                        _.each(cluster.markers_, $.proxy(function(marker, key) {
                            if (marker.isCombined == true) {
                                var infowWindow = this.infoWindows[marker.customId];
                                // Open or close infowindow
                                if (infowWindow.isOpen() == true) {
                                    infowWindow.close();
                                    marker.isClicked = false;
                                    this.changeMarkerIcon(marker, 'default');
                                } else {
                                    // Reset markers
                                    this.resetAllMarkers();
                                    infowWindow.setBubbleOffset(0, -40);
                                    // Open targeted markers
                                    infowWindow.open(this.map, marker);
                                    this.map.panTo(marker.getPosition());
                                    this.map.panBy(0, -100);
                                    marker.isClicked = true;
                                    this.changeMarkerIcon(marker, 'hover');
                                }
                            }
                        }, this));
                    }
                }, this));
            }

            window.google.maps.event.addDomListener(window, 'resize', $.proxy(function() {
                var center = this.map.getCenter();
                window.google.maps.event.trigger(this.map, 'resize');
                this.map.setCenter(center);
            }, this));

            window.google.maps.event.addListener(this.map, 'dragend', $.proxy(function() {
                this.setCurrentMapEndpoints();
                this.mapWrapper.trigger('mapMoved');
            }, this));

            window.google.maps.event.addListener(this.map, 'zoom_changed', $.proxy(function() {
                this.setCurrentMapEndpoints();

                // On zoom out
                if (this.currentMapZoom > this.map.getZoom()) {
                    this.mapWrapper.trigger('mapZoomChanged');
                }

                // Set current zoom variable
                this.currentMapZoom = this.map.getZoom();
            }, this));

        },

        // Set current maps endpoint (4 corners pos)
        setCurrentMapEndpoints: function() {
            var bounds = this.map.getBounds();
            var northEastCorner = bounds.getNorthEast();
            var southWestCorner = bounds.getSouthWest();

            var northWestCorner = new google.maps.LatLng(northEastCorner.lat(), southWestCorner.lng());
            var southEastCorner = new google.maps.LatLng(southWestCorner.lat(), northEastCorner.lng());

            this.mapWrapper.attr('data-ne-lat', northEastCorner.lat());
            this.mapWrapper.attr('data-ne-lng', northEastCorner.lng());

            this.mapWrapper.attr('data-sw-lat', southWestCorner.lat());
            this.mapWrapper.attr('data-sw-lng', southWestCorner.lng());

            this.mapWrapper.attr('data-nw-lat', northWestCorner.lat());
            this.mapWrapper.attr('data-nw-lng', northWestCorner.lng());

            this.mapWrapper.attr('data-se-lat', southEastCorner.lat());
            this.mapWrapper.attr('data-se-lng', southEastCorner.lng());

        },

        // Events on all HTML markers
        // @param $markers: markers html elements
        bindHtmlMarkerEvents: function() {
            this.$htmlMarkers.on('click', $.proxy(function(e) {
                var id = $(e.currentTarget).attr('data-id');

                // If element to be combined
                if (this.config.combine == true) {
                    var combineID = $(e.currentTarget).attr('data-combine');

                    if (combineID != '') {
                        id = combineID;
                    }
                }

                var markerObject = this.markers[id];
                // Unbind mouse leave to keep marker highlighted
                this.$htmlMarkers.unbind('mouseleave');
                // Highlight current marker
                this.changeMarkerIcon(markerObject, 'hover');
                // Move to marker
                this.map.panTo(markerObject.getPosition());
                // Center map on marker
                setTimeout($.proxy(function() {
                    this.map.setZoom(16);
                }, this), 500);
            }, this));

            this.$htmlMarkers.on('mouseenter', $.proxy(function(e) {
                var id = $(e.currentTarget).attr('data-id');

                // If element to be combined
                if (this.config.combine == true) {
                    var combineID = $(e.currentTarget).attr('data-combine');
                    // If element to be combined
                    if (combineID != '') {
                        id = combineID;
                    }
                }

                var markerObject = this.markers[id];
                // Change the icon on hover
                this.changeMarkerIcon(markerObject, 'hover');
            }, this));

            this.bindHtmlMarkerMouseLeave();
        },

        bindHtmlMarkerMouseLeave: function() {
            this.$htmlMarkers.on('mouseleave', $.proxy(function(e) {
                var id = $(e.currentTarget).attr('data-id');

                // If element to be combined
                if (this.config.combine == true) {
                    var combineID = $(e.currentTarget).attr('data-combine');

                    // If element to be combined
                    if (combineID != '') {
                        id = combineID;
                    }
                }

                var markerObject = this.markers[id];
                // Change the icon on hover
                this.changeMarkerIcon(markerObject, 'default');
            }, this));
        },

        // Event on all google maps markers
        // @param marker: marker element (GMAP Object)
        bindMapsMarkerEvents: function(marker) {
            var $marker = $('[data-id="' + marker.customId + '"]');
            // Add or remove active class on html markers
            google.maps.event.addListener(marker, 'mouseover', $.proxy(function() {
                this.changeMarkerIcon(marker, 'hover');
            }, this));
            google.maps.event.addListener(marker, 'mouseout', $.proxy(function() {
                if (marker.isClicked !== true) {
                    //$marker.removeClass(this.classes.states.active);
                    this.changeMarkerIcon(marker, 'default');
                }
            }, this));
        },

        // Change marker icon
        // @param marker: marker element (GMAP object)
        // @param state: define the state of the icon (active or default)
        changeMarkerIcon: function(marker, state) {
            // Default icon or hover
            var markerIcon = marker.iconDefault;
            if (state === 'hover') {
                markerIcon = marker.iconHover;
            }
            if (markerIcon != '') {
                marker.setIcon(markerIcon);
            }
        },

        // Lock the map (remove scroll)
        lockMap: function() {
            this.$mapObj.css('pointer-events', 'none');
            this.bindLockMapEvents();
        },

        // Events binding for the locked map
        // - on click activate the map
        // - on mouse leave desactivate the map
        bindLockMapEvents: function() {
            this.mapWrapper.on('click', $.proxy(function() {
                this.mapWrapper.addClass(this.classes.states.active);
                this.$mapObj.css('pointer-events', 'auto');
            }, this));

            this.mapWrapper.on('mouseleave', $.proxy(function() {
                this.mapWrapper.removeClass(this.classes.states.active);
                this.$mapObj.css('pointer-events', 'none');
            }, this));
        },

        // Reload map and recenter it
        refreshMap: function(recenter = true) {
            window.google.maps.event.trigger(this.map, 'resize');
            if (recenter == true) {
                if (this.config.fitCenterMarkers === true) {
                    this.fitCenterBounds();
                } else {
                    this.map.setCenter(new window.google.maps.LatLng(this.config.lat, this.config.lng));
                }
            }
        },

        // Fit bounds map
        fitCenterBounds: function() {
            var bounds = new google.maps.LatLngBounds();
            _.each(this.markers, $.proxy(function(marker) {
                if (marker != undefined) {
                    bounds.extend(marker.getPosition());
                }
            }, this));
            this.map.fitBounds(bounds);
            // Set zoom variable
            this.currentMapZoom = this.map.getZoom();
        },

        centerMarker: function(markerId, zoom = 16) {
            var latLng = this.markers[markerId].getPosition();
            this.map.setCenter(latLng);
            this.map.setZoom(zoom);
            // Set zoom variable
            this.currentMapZoom = this.map.getZoom();
        },

        // Reset marker to default state
        // @param marker: marker (GMAP object)
        resetMarker: function(marker) {
            marker.isClicked = false;
            this.changeMarkerIcon(marker, 'default');
            //$('[data-id="' + marker.customId + '"]').removeClass(this.config.classes.states.active);
        },

        // Reset all info windows and markers
        resetAllMarkers: function() {
            // Reset all info windows
            _.each(this.infoWindows, $.proxy(function(infoWindow) {
                infoWindow.close();
            }, this));
            // Reset all markers
            _.each(this.markers, $.proxy(function(marker) {
                if (marker != undefined) {
                    this.resetMarker(marker);
                }
            }, this));
            // Unbind mouseleave
            this.$htmlMarkers.unbind('mouseleave');
            // Rebind it
            this.bindHtmlMarkerMouseLeave();
        },

        // Reset all info windows and markers
        resetAllInfoWindows: function() {
            // Reset all info windows
            _.each(this.infoWindows, $.proxy(function(infoWindow) {
                infoWindow.close();
            }, this));
        }

    });

    $.fn.customMap = function(options) {
        this.each($.proxy(function(index, element) {
            var $element = $(element);

            // Return early if this $element already has a plugin instance
            if ($element.data('custom-map')) return;

            // Pass options to plugin constructor
            var map = new CustomMap(element, options);

            // Add every public methods to plugin
            for (var key in map.publicMethods) {
                this[key] = map.publicMethods[key];
            }

            // Store plugin object in this $element's data
            $element.data('custom-map', map);
        }, this));

        return this;
    };
})(jQuery);