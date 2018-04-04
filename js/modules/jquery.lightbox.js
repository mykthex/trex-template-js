// Lightbox jQuery Plugin
// Accessible, responsive and configurable jQuery lightbox plugin

(function($) {
    var Lightbox = function(element, options) {
        this.lightbox = $(element);

        // Default module configuration
        this.defaults = {
            keepFocusInside: true,
            createGallery: false,
            closeSiblings: false,
            loop: false,
            isJsAnimation: true,
            elementToFocus: null,
            delayToFocus: 0,
            animation: 'fade',
            animationTime: 250,
            desactivateBodyScroll: true,
            divToAppendNavButtons: '.lightbox-wrapper',
            appendCloseBtnTo: 'self',
            resizeContainer: false,
            onOpenLightbox: $.noop,
            onCloseLightbox: $.noop,
            labels: {
                navigationPrev: 'Précédent',
                navigationPrevHidden: 'Précédent',
                navigationNext: 'Suivant',
                navigationNextHidden: 'Suivant',
                closeButton: 'Fermer la lightbox',
                closeButtonHidden: 'Fermer la lightbox'
            },
            classes: {
                wrapper: 'lightbox-wrapper',
                shadow: 'lightbox-shadow',
                guard: 'lightbox-guard',
                guardPrev: 'lightbox-guard-prev',
                guardNext: 'lightbox-guard-next',
                navigationBtnClasses: '',
                navigationPrev: 'lightbox-prev-button',
                navigationNext: 'lightbox-next-button',
                closeButton: 'lightbox-close-button',
                visuallyhidden: 'visuallyhidden',
                states: {
                    active: 'is-active',
                    activeSwitch: 'is-active-switch',
                    inactive: 'is-inactive'
                }
            }
        };

        // Merge default classes with window.project.classes
        this.classes = $.extend(true, this.defaults.classes, (window.project ? window.project.classes : {}));

        // Merge default labels with window.project.labels
        this.labels = $.extend(true, this.defaults.labels, (window.project ? window.project.labels : {}));

        // Merge default config with custom config
        this.config = $.extend(true, this.defaults, options || {});

        this.publicMethods = {
            open: $.proxy(function() {
                this.openLightbox('change');
            }, this),
            close: $.proxy(function() {
                this.closeLightbox('change');
            }, this)
        };

        this.lightboxWrapper = this.lightbox.find('.' + this.classes.wrapper);
        this.lightboxIdentifier = this.lightbox.attr('data-lightbox-id');

        this.lightboxOpenTriggers = $('button[data-open-lightbox="' + this.lightboxIdentifier + '"]');

        this.init();
    };

    $.extend(Lightbox.prototype, {

        // Component initialization
        init: function() {
            // Check for aria and labels on the HTML element - overwrite JS config
            this.updatePluginText();
            // Create a gallery of lightbox if config set to true
            if (this.config.createGallery == true) {
                this.galleryIdentifier = this.lightbox.attr('data-gallery');
                this.galleryElements = $('[data-gallery="' + this.galleryIdentifier + '"]');
                // If there's actually more than one lightbox with the data-gallery
                if (this.galleryElements.length > 1) {
                    this.currentElementIndex = this.galleryElements.index(this.lightbox);
                    this.currentLightbox = this.galleryElements.eq(this.currentElementIndex);
                    this.nbLightboxIndexes = this.galleryElements.length - 1;
                    this.createNavigation();
                }
            }
            // Add the close button
            if (this.config.appendCloseBtnTo == 'self') {
                this.lightbox.append('<button class="' + this.classes.closeButton + '" data-close-lightbox="' + this.lightboxIdentifier + '">' + this.config.labels.closeButton + ' <span class="' + this.config.classes.visuallyhidden + '">' + this.config.labels.closeButtonHidden + '</span></button>');
            } else {
                this.lightbox.find(this.config.appendCloseBtnTo).append('<button class="' + this.classes.closeButton + '" data-close-lightbox="' + this.lightboxIdentifier + '">' + this.config.labels.closeButton + ' <span class="' + this.config.classes.visuallyhidden + '">' + this.config.labels.closeButtonHidden + '</span></button>');
            }
            // Add the background shadow to the lightbox
            this.lightbox.append('<div class="' + this.classes.shadow + ' ' + this.classes.states.active + '"></div>');
            this.lightboxShadow = this.lightbox.find('.' + this.classes.shadow);
            this.initVideos();
            this.bindEvents();
            if (this.lightbox.hasClass(this.classes.states.active)) {
                this.openLightbox('new');
            }
        },

        bindEvents: function() {
            $(document).on('click', '[data-open-lightbox="' + this.lightboxIdentifier + '"]', $.proxy(function(e) {
                this.openLightbox('new');
                $(e.currentTarget).addClass(this.classes.states.active);
                e.preventDefault();
            }, this));

            $(document).on('click', '[data-close-lightbox="' + this.lightboxIdentifier + '"]', $.proxy(function(e) {
                this.closeLightbox('close');
                e.preventDefault();
            }, this));

            this.lightboxShadow.on('click', $.proxy(function(e) {
                this.closeLightbox('close');
                e.preventDefault();
            }, this));

            $(document).keyup($.proxy(function(e) {
                if (e.keyCode === 27) this.closeLightbox('close');
            }, this));

        },

        updatePluginText: function() {
            // Loop through labels in config
            $.each(this.config.labels, $.proxy(function(labelKey, labelText) {
                // Loop through labels in element data attributes to see if it's set
                $.each(this.lightbox.data(), $.proxy(function(dataLabelKey, dataLabelText) {
                    var dataLabelKeyCamelCased = dataLabelKey.replace(/-([a-z])/g, function(g) {
                        return g[1].toUpperCase();
                    });
                    // We have a match!
                    if (dataLabelKeyCamelCased === labelKey) {
                        this.config.labels[dataLabelKeyCamelCased] = dataLabelText;
                    }
                }, this));
            }, this));
        },

        initVideos: function() {
            // Get all YouTube videos iframes
            var youtubeVideos = this.lightbox.find('iframe[src*="youtube.com"]');
            if (youtubeVideos.length > 0) {
                this.youtubeVideos = youtubeVideos;
                // For each YouTube video
                youtubeVideos.each(function() {
                    var $this = $(this);
                    var src = $this.attr('src');
                    // Enabled JS API if not enabled
                    if (src.indexOf('enablejsapi=1') === -1) {
                        if (src.indexOf('?') === -1) {
                            src = src + '?enablejsapi=1'
                        } else {
                            src = src + '&enablejsapi=1'
                        }
                        $this.attr('src', src);
                    }
                });
            }

            // Get all Vimeo videos iframes
            var vimeoVideos = this.lightbox.find('iframe[src*="vimeo.com"]');
            if (vimeoVideos.length > 0) {
                this.vimeoVideos = vimeoVideos;
                // For each YouTube video
                vimeoVideos.each(function() {
                    var $this = $(this);
                    var src = $this.attr('src');
                    // Enabled JS API if not enabled
                    if (src.indexOf('api=1') === -1) {
                        if (src.indexOf('?') === -1) {
                            src = src + '?api=1'
                        } else {
                            src = src + '&api=1'
                        }
                        $this.attr('src', src);
                    }
                });
            }

        },

        // Add previous and next buttons to the lightbox wrapper
        createNavigation: function() {
            this.lightbox.find(this.config.divToAppendNavButtons).append('<button class="' + this.classes.navigationPrev + ' ' + this.classes.navigationBtnClasses + '">' + this.config.labels.navigationPrev + ' <span class="' + this.config.classes.visuallyhidden + '">' + this.config.labels.navigationPrevHidden + '</span></button>');
            this.lightbox.find(this.config.divToAppendNavButtons).append('<button class="' + this.classes.navigationNext + ' ' + this.classes.navigationBtnClasses + '">' + this.config.labels.navigationNext + ' <span class="' + this.config.classes.visuallyhidden + '">' + this.config.labels.navigationNextHidden + '</span></button>');

            // Get previous and next buttons
            this.navigationPrev = this.lightboxWrapper.find('.' + this.classes.navigationPrev);
            this.navigationNext = this.lightboxWrapper.find('.' + this.classes.navigationNext);

            if (this.config.loop === false) {
                if (this.currentElementIndex === 0) {
                    this.navigationPrev.addClass(this.config.classes.states.inactive);
                }
                if (this.currentElementIndex === this.nbLightboxIndexes) {
                    this.navigationNext.addClass(this.config.classes.states.inactive);
                }
            }

            this.bindNavigation();
        },

        // Bind navigation events on previous and next buttons
        bindNavigation: function() {
            this.navigationPrev.on('click', $.proxy(function() {
                var index;
                if (this.config.loop === false) {
                    if (this.currentElementIndex == 0) {
                        index = 0;
                        this.navigationPrev.addClass(this.classes.states.inactive);
                    } else {
                        index = this.currentElementIndex - 1;
                        this.navigationPrev.removeClass(this.classes.states.inactive);
                        this.changeLightbox(this.galleryElements.eq(index));
                    }
                } else {
                    if (this.currentElementIndex != 0) {
                        index = this.currentElementIndex - 1;
                    } else {
                        index = this.nbLightboxIndexes;
                    }
                    this.changeLightbox(this.galleryElements.eq(index));
                }
            }, this));

            this.navigationNext.on('click', $.proxy(function() {
                var index;
                if (this.config.loop === false) {
                    if (this.currentElementIndex == this.nbLightboxIndexes) {
                        index = this.nbLightboxIndexes;
                        this.navigationNext.addClass(this.classes.states.inactive);
                    } else {
                        index = this.currentElementIndex + 1;
                        this.changeLightbox(this.galleryElements.eq(index));
                        this.navigationNext.removeClass(this.classes.states.inactive);
                    }
                } else {
                    if (this.currentElementIndex < this.nbLightboxIndexes) {
                        index = this.currentElementIndex + 1;
                    } else {
                        index = 0;
                    }
                    this.changeLightbox(this.galleryElements.eq(index));
                }
            }, this));
        },

        // Change of lightbox on navigation click
        changeLightbox: function(lightboxToOpen) {
            this.closeLightbox('change');
            var lightboxToOpenElement = lightboxToOpen.data('lightbox');
            lightboxToOpenElement.publicMethods.open('change');
        },

        /*
        State == "new" or "change"
         */
        openLightbox: function(state) {
            // Close other lightboxes if config is set
            if (this.config.closeSiblings) {
                this.closeSiblings();
            }

            this.createGuards();

            if (state == 'new') {
                this.lightbox.addClass(this.classes.states.active);
            } else {
                this.lightbox.addClass(this.classes.states.activeSwitch);
            }

            this.lightbox.attr('tabindex', -1);
            setTimeout($.proxy(function() {
                this.lightbox.focus();
            }, this), 0);

            // If element to focus is specified
            if (this.config.elementToFocus != null) {
                setTimeout($.proxy(function() {
                    this.lightbox.find(this.config.elementToFocus).focus();
                }, this), this.config.delayToFocus);
            }

            if (this.config.resizeContainer) {
                this.resizeContainer();
            }

            // If js animation or only css
            if (this.config.isJsAnimation === true) {
                // If switching between lightbox, don't fadeIn the background
                if (state == 'new') {
                    switch (this.config.animation) {
                        case 'fade':
                            this.lightbox.fadeIn(this.config.animationTime);
                            break;
                        case 'slide':
                            this.lightbox.slideDown(this.config.animationTime);
                        default:
                            this.lightbox.show();
                    }
                } else {
                    switch (this.config.animation) {
                        case 'fade':
                            this.lightboxWrapper.hide();
                            this.lightbox.show();
                            this.lightboxWrapper.fadeIn(this.config.animationTime);
                            break;
                        case 'slide':
                            this.lightboxWrapper.hide();
                            this.lightbox.show();
                            this.lightboxWrapper.slideDown(this.config.animationTime);
                        default:
                            this.lightbox.show();
                    }
                }
            }

            // Public callback
            this.config.onOpenLightbox(this.lightbox);

            // Desactivate body scroll if config is set to true
            if (this.config.desactivateBodyScroll == true) {
                $('body').css('overflow', 'hidden');
            }
        },
        /*
        State == "close" or "change"
         */
        closeLightbox: function(state) {
            if (state == 'new') {
                this.lightbox.removeClass(this.classes.states.active);
            } else {
                this.lightbox.removeClass(this.classes.states.active);
                this.lightbox.removeClass(this.classes.states.activeSwitch);
            }

            // If js animation or only css
            if (this.config.isJsAnimation === true) {
                // If switching between lightbox, don't fadeout the background
                if (state == 'close') {
                    switch (this.config.animation) {
                        case 'fade':
                            this.lightbox.fadeOut(this.config.animationTime);
                            break;

                            break;
                        default:
                            this.lightbox.hide();
                    }
                } else {
                    this.lightbox.hide();
                }
            }

            // Public callback
            this.config.onCloseLightbox(this.lightbox);

            // Reactivate body scroll if config is set to true
            if (this.config.desactivateBodyScroll == true) {
                $('body').css('overflow', 'auto');
            }

            // If there is youtubeVideos present in lightbox
            if (typeof this.youtubeVideos !== 'undefined' && this.youtubeVideos.length > 0) {
                // Pause each video using JS API
                this.youtubeVideos.each(function() {
                    this.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                });
            }

            // If there is vimeoVideos present in lightbox
            if (typeof this.vimeoVideos !== 'undefined' && this.vimeoVideos.length > 0) {
                // Pause each video using JS API
                this.vimeoVideos.each(function() {
                    this.contentWindow.postMessage('{"method":"pause"}', '*');
                });
            }

            this.removeGuards();
            // Focus on the first trigger
            this.lightboxOpenTriggers.eq(0).removeClass(this.classes.states.active);
            this.lightboxOpenTriggers.eq(0).focus();
        },

        resizeContainer: function() {
            var padding = parseInt(this.lightbox.css('padding-top')) + parseInt(this.lightbox.css('padding-bottom')) + parseInt(this.lightboxWrapper.css('padding-top')) + parseInt(this.lightboxWrapper.css('padding-bottom'));
            var height = $(window).height() - padding;

            this.lightboxWrapper.find('img').css('max-height', height);
            this.lightboxWrapper.find('img').css('max-width', '100%');
            this.lightboxWrapper.css('max-height', height);
        },

        createGuards: function() {
            this.lightbox.before('<button class="' + this.classes.guard + ' ' + this.classes.visuallyhidden + ' ' + this.classes.guardPrev + '"></button>');
            this.lightbox.after('<button class="' + this.classes.guard + ' ' + this.classes.visuallyhidden + ' ' + this.classes.guardNext + '"></button>');

            this.lightboxGuards = this.lightbox.prev('.' + this.classes.guard).add(this.lightbox.next('.' + this.classes.guard));
            this.lightboxGuards.on('focus', $.proxy(function(e) {
                this.onGuardFocus(e);
            }, this));
        },

        onGuardFocus: function(e) {
            var $guard = $(e.currentTarget);
            var focusableElements = 'a:not(.no-focus), button:not(.no-focus), input:not(.no-focus)';

            if (this.config.keepFocusInside) {
                if ($guard.hasClass(this.classes.guardPrev)) {
                    console.log(this.lightbox.find(focusableElements).last());
                    this.lightbox.find(focusableElements).last().focus();
                } else {
                    console.log(this.lightbox.find(focusableElements).first());
                    this.lightbox.find(focusableElements).first().focus();
                }
            } else {
                this.closeLightbox('close');
            }
        },

        removeGuards: function() {
            this.lightboxGuards.off('focus');
            this.lightboxGuards.remove();
        },

        closeSiblings: function() {
            var siblings = this.getSiblings().not(this.lightbox);
            var siblingsGuardsNext = siblings.next('.' + this.classes.guard);
            var siblingsGuardsPrev = siblings.prev('.' + this.classes.guard);

            siblingsGuardsPrev.off('focus');
            siblingsGuardsNext.off('focus');
            siblingsGuardsPrev.remove();
            siblingsGuardsNext.remove();

            $('[data-open-lightbox]').removeClass(this.classes.states.active);
            siblings.removeClass(this.classes.states.active);

            if (this.config.isJsAnimation === true) {
            	siblings.hide();
            }
        },

        // If lightbox is inside a group, get all siblings
        getSiblings: function() {
            return this.lightbox.siblings() || false;
        }
    });

    $.fn.lightbox = function(options) {
        this.each($.proxy(function(index, element) {
            var $element = $(element);

            // Return early if this $element already has a plugin instance
            if ($element.data('lightbox')) return;

            // Pass options to plugin constructor
            var lightbox = new Lightbox(element, options);

            // Add every public methods to plugin
            for (var key in lightbox.publicMethods) {
                this[key] = lightbox.publicMethods[key];
            }

            // Store plugin object in this $element's data
            $element.data('lightbox', lightbox);
        }, this));

        return this;
    };
})(jQuery);