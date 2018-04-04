// Slider jQuery Plugin
// A responsive and a11y friendly jQuery slider.

(function($) {
    var Slider = function(element, options) {
        this.slider = $(element);

        // Default module configuration
        this.defaults = {
            noCss: false,
            displayedSlides: 4,
            slidesGutter: 20,
            createArrowsNavigation: true,
            createPagesNavigation: true,
            createActiveContentNavigation: true,
            displayPageNumber: true,
            displayFirstActiveContent: true,
            activeContentThumbnail: false,
            swipe: true,
            autoplay: false,
            autoplayDelay: 3000,
            infiniteLoop: true,
            animationSpeed: 300,
            addActiveClass: true,
            changeSlideUrlParameter: 'changeSlide',
            onActiveSlideUpdateBefore: $.noop,
            onActiveSlideUpdateAfter: $.noop,
            onChangeSlideBefore: $.noop,
            onChangeSlideAfter: $.noop,
            onLayoutUpdateBefore: $.noop,
            onLayoutUpdateAfter: $.noop,
            labels: {
                navigationPrev: 'Précédent',
                navigationPrevAria: 'La diapositive précédente est affichée.',
                navigationNext: 'Suivant',
                navigationNextAria: 'La diapositive suivante est affichée.',
                pagesNavigation: 'Afficher la diapositive',
                pagesNavigationActive: 'Diapositive présentement affichée',
                activeContentNavigationPrev: 'Précédent',
                activeContentNavigationNext: 'Suivant',
                autoplayButton: 'Mettre le carrousel en marche',
                autoplayButtonPause: 'Mettre le carrousel en pause'
            },
            classes: {
                sliderOverflow: 'slider-overflow',
                sliderWrapper: 'slider-wrapper',
                sliderContainer: 'slider-container',
                slide: 'slide',
                sliderActiveContentTrigger: 'slider-active-content-trigger',
                sliderActiveContentContainer: 'slider-active-content-container',
                sliderNavigation: 'slider-navigation',
                navigationPrev: 'slider-navigation-prev',
                navigationNext: 'slider-navigation-next',
                arrowsNavigation: 'slider-navigation-arrows',
                pagesNavigation: 'slider-navigation-pages',
                activeContentNavigation: 'slider-navigation-active-content',
                activeContentNavigationPrev: 'slider-navigation-active-content-prev',
                activeContentNavigationNext: 'slider-navigation-active-content-next',
                ariaText: 'aria-text',
                ariaTextActive: 'aria-text-active',
                ariaHiddenBox: 'aria-hidden-box',
                autoplayButton: 'slider-autoplay',
                states: {
                    active: 'is-active'
                }
            }
        };

        // Merge default classes with window.project.classes
        this.classes = $.extend(true, this.defaults.classes, (window.project ? window.project.classes : {}));

        // Merge default labels with window.project.labels
        this.labels = $.extend(true, this.defaults.labels, (window.project ? window.project.labels : {}));

        // Merge default config with custom config
        this.config = $.extend(true, this.defaults, options || {});

        // Get sliders wrapper
        this.sliderWrapper = this.slider.find('.' + this.classes.sliderWrapper);

        // Get sliders container
        this.sliderContainer = this.slider.find('.' + this.classes.sliderContainer);

        // Get slides
        this.slides = this.slider.find('.' + this.classes.slide);

        // Initialize activeSlideIndex
        this.activeSlideIndex = 0;

        // Initialize mouse hover state
        this.mouseHover = false;

        // Initialize animated state
        this.isAnimated = false;

        // Get url parameter
        this.urlParameter = this.getUrlParameter(this.config.changeSlideUrlParameter);

        this.publicMethods = {
            prevSlide: $.proxy(function() {
                this.changeSlide(this.activeSlideIndex - 1);
            }, this),
            nextSlide: $.proxy(function() {
                this.changeSlide(this.activeSlideIndex + 1);
            }, this),
            startAutoplay: $.proxy(function() {
                this.autoplay();
            }, this),
            stopAutoplay: $.proxy(function() {
                this.stopAutoplay();
            }, this)
        };

        this.init();
    };

    $.extend(Slider.prototype, {

        // Component initialization
        init: function() {
            // Check for aria and labels on the HTML element - overwrite JS config
            this.updatePluginText();

            this.initLayout(this.config.displayedSlides);
            this.createAriabox();

            if (this.slides.length > this.config.displayedSlides) {
                if (this.config.createArrowsNavigation || this.config.createPagesNavigation) {
                    this.createNavigation();
                }
                if (this.config.autoplay) this.autoplay();
                if (this.config.swipe) this.swipe();
            }

            // Create active content wrapper
            if (this.isActiveContent()) {
                this.initActiveContent();

                if (this.config.createActiveContentNavigation) {
                    this.createActiveContentNavigation();
                }
            }

            if (this.urlParameter) {
                var animationSpeed = this.animationSpeed;
                this.animationSpeed = 0;

                this.changeSlide(this.urlParameter);

                this.animationSpeed = animationSpeed;
            }

            // Bind events
            this.bindEvents();
        },

        updatePluginText: function() {
            // Loop through labels in config
            $.each(this.config.labels, $.proxy(function(labelKey, labelText) {
                // Loop through labels in element data attributes to see if it's set
                $.each(this.slider.data(), $.proxy(function(dataLabelKey, dataLabelText) {
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

        // Layout initialization
        initLayout: function() {
            var slideWidth = 100 / this.slides.length;

            // Callback
            this.config.onLayoutUpdateBefore();

            // Create slider overflow wrapper
            this.sliderWrapper.wrap('<div class="' + this.classes.sliderOverflow + '"></div>');
            this.slider.find('.' + this.classes.sliderOverflow).css('overflow', 'hidden');

            // Add necessary css for the slider
            if (!this.config.noCss) {
                this.sliderWrapper.css({
                    'position': 'relative',
                    'overflow': 'hidden',
                    'margin-left': this.config.slidesGutter / 2 * -1 + 'px',
                    'margin-right': this.config.slidesGutter / 2 * -1 + 'px'
                });

                this.sliderContainer.css({
                    'position': 'relative',
                    'left': '0',
                    'font-size': '0',
                    'width': this.slides.length / this.config.displayedSlides * 100 + '%'
                });

                this.slides.css({
                    'position': 'relative',
                    'display': 'inline-block',
                    'width': 'calc(' + slideWidth + '% - ' + this.config.slidesGutter + 'px)',
                    'margin-left': this.config.slidesGutter / 2 + 'px',
                    'margin-right': this.config.slidesGutter / 2 + 'px',
                    'font-size': '1rem'
                });
            }

            // Add active class on first slide
            if (this.config.addActiveClass) {
                $(this.slides[0]).addClass(this.config.classes.states.active);
            }

            // Disable focus on hidden slides
            this.slides.slice(this.config.displayedSlides).find('a, button, :input, [tabindex]').attr('tabindex', '-1');

            // Callback
            this.config.onLayoutUpdateAfter();
        },

        // Bind events with actions
        bindEvents: function() {
            this.slider.hover($.proxy(function() {
                this.mouseHover = true;
            }, this), $.proxy(function() {
                this.mouseHover = false;
            }, this));

            // Detect keyboard navigation
            $(document).on('keyboardnavigation', $.proxy(function() {
                this.stopAutoplay();
            }, this));
        },

        // Active Content initialization
        initActiveContent: function() {
            this.activeContentTriggers = this.slides.find('.' + this.classes.sliderActiveContentTrigger);
            this.activeContentWrapper = $('.' + this.slider.data('active-content'));

            this.activeContentWrapper.wrapInner('<div class="' + this.classes.sliderActiveContentContainer + '"></div>');
            this.activeContentContainer = this.activeContentWrapper.find('.' + this.classes.sliderActiveContentContainer);

            this.activeContentTriggers.on('click', $.proxy(function(e) {
                var $element = $(e.currentTarget);
                var $slide = $element.parents('.' + this.classes.slide);
                var content = $slide.find('.' + $element.data('show-active-content')).clone();
                var index = $slide.index();

                if (this.config.addActiveClass) {
                    this.slides.removeClass(this.classes.states.active);
                    $slide.addClass(this.classes.states.active);
                }

                this.updateActiveSlideContent(content, index);
                e.preventDefault();
            }, this));

            if (this.config.displayFirstActiveContent) {
                this.activeContentTriggers.first().trigger('click');
            }
        },

        // Update active slide content
        updateActiveSlideContent: function(content, index) {
            this.config.onActiveSlideUpdateBefore();
            this.activeContentContainer.html(content);
            // Change src if thumbnail is different from full image
            if (this.config.activeContentThumbnail == true) {
                var $img = this.activeContentContainer.find('img');
                var dataSrc = $img.data('src');
                if (dataSrc != '') {
                    $img.attr('src', dataSrc);
                }
            }
            this.activeContentWrapper.attr('data-index', index);
            this.config.onActiveSlideUpdateAfter();
        },

        // Create navigation
        createNavigation: function() {
            // Clear existing navigation
            this.slider.find('.' + this.classes.sliderNavigation).remove();

            // Create navigation wrapper
            this.sliderWrapper.after('<div class="' + this.classes.sliderNavigation + ' clearfix"></div>');

            // Get navigation wrapper obejct
            this.sliderNavigation = this.slider.find('.' + this.classes.sliderNavigation);

            if (this.config.createArrowsNavigation) this.createArrowsNavigation();
            if (this.config.createPagesNavigation) this.createPagesNavigation();
        },

        // Create arrows navigation
        createArrowsNavigation: function() {
            var previousButton = '<button class="' + this.classes.navigationPrev + '"><span class="visuallyhidden ' + this.classes.ariaText + '">' + this.labels.navigationPrev + '</span></button>',
                nextButton = '<button class="' + this.classes.navigationNext + '"><span class="visuallyhidden ' + this.classes.ariaText + '">' + this.labels.navigationNext + '</span></button>';

            // Create navigation wrapper
            this.sliderNavigation.append('<div class="' + this.classes.arrowsNavigation + '-wrapper"></div>');

            // Append each button
            this.sliderNavigation.find('.' + this.classes.arrowsNavigation + '-wrapper').append(previousButton, nextButton);

            // Get previous and next buttons
            this.previousNavigation = this.sliderNavigation.find('.' + this.classes.navigationPrev);
            this.nextNavigation = this.sliderNavigation.find('.' + this.classes.navigationNext);

            if (this.config.createArrowsNavigation || this.config.createPagesNavigation) {
                this.previousNavigation.attr('aria-hidden', 'true');
                this.nextNavigation.attr('aria-hidden', 'true');
            }

            this.bindEventsArrowsNavigation();
        },

        // Bind events for the arrows navigation
        bindEventsArrowsNavigation: function() {
            this.previousNavigation.on('click', $.proxy(function() {
                this.navigationTypeTriggered = 'arrows';

                this.changeSlide(this.activeSlideIndex - 1);
                this.updateAriabox(this.config.labels.navigationPrevAria);
                this.stopAutoplay();
            }, this));

            this.nextNavigation.on('click', $.proxy(function() {
                this.navigationTypeTriggered = 'arrows';

                this.changeSlide(this.activeSlideIndex + 1);
                this.updateAriabox(this.config.labels.navigationNextAria);
                this.stopAutoplay();
            }, this));
        },

        // Create pages navigation
        createPagesNavigation: function() {
            var button = '<button class="' + this.classes.pagesNavigation + '"><span class="visuallyhidden ' + this.classes.ariaText + '"></span></button>';

            // Create navigation wrapper
            this.sliderNavigation.append('<div class="' + this.classes.pagesNavigation + '-wrapper"></div>');

            // Append each pages
            for (var i = 0; i < this.slides.length / this.config.displayedSlides; i++) {
                this.sliderNavigation.find('.' + this.classes.pagesNavigation + '-wrapper').append(button);
            }

            // Get pages elements
            this.pagesNavigation = this.sliderNavigation.find('.' + this.classes.pagesNavigation);

            // Add aria text for each page
            this.pagesNavigation.each($.proxy(function(index, element) {
                if (this.config.displayPageNumber === true) {
                    $(element).find('.' + this.classes.ariaText).text(this.labels.pagesNavigation).after(index + 1);
                } else {
                    $(element).find('.' + this.classes.ariaText).text(this.labels.pagesNavigation + (parseInt(index) + 1));
                }
            }, this));

            // Initialize first page button
            this.pagesNavigation.eq(0).addClass(this.classes.states.active).append('<span class="visuallyhidden ' + this.classes.ariaTextActive + '">' + this.labels.pagesNavigationActive + '</span>');

            this.bindEventsPagesNavigation();
        },

        // Bind events for the pages navigation
        bindEventsPagesNavigation: function() {
            // Get pages elements
            this.pagesNavigation = this.sliderNavigation.find('.' + this.classes.pagesNavigation);

            this.pagesNavigation.on('click', $.proxy(function(e) {
                var index = $(e.currentTarget).index();

                this.navigationTypeTriggered = 'pages';
                this.pagesNavigation.removeClass(this.classes.states.active);
                $(e.currentTarget).addClass(this.classes.states.active);

                this.changeSlide(index * this.config.displayedSlides);

                this.stopAutoplay();
            }, this));
        },

        createActiveContentNavigation: function() {
            var previousButton = '<button class="' + this.classes.activeContentNavigationPrev + '"><span class="visuallyhidden ' + this.classes.ariaText + '">' + this.labels.activeContentNavigationPrev + '</span></button>',
                nextButton = '<button class="' + this.classes.activeContentNavigationNext + '"><span class="visuallyhidden ' + this.classes.ariaText + '">' + this.labels.activeContentNavigationNext + '</span></button>';

            // Create navigation wrapper
            this.activeContentWrapper.append('<div class="' + this.classes.activeContentNavigation + '-wrapper"></div>');

            // Append each button
            this.activeContentWrapper.find('.' + this.classes.activeContentNavigation + '-wrapper').append(previousButton, nextButton);

            // Get previous and next buttons
            this.previousActiveContentNavigation = this.activeContentWrapper.find('.' + this.classes.activeContentNavigationPrev);
            this.nextActiveContentNavigation = this.activeContentWrapper.find('.' + this.classes.activeContentNavigationNext);

            this.previousActiveContentNavigation.attr('aria-hidden', 'true');
            this.nextActiveContentNavigation.attr('aria-hidden', 'true');

            this.bindEventsActiveContentNavigation();
        },

        bindEventsActiveContentNavigation: function() {
            this.previousActiveContentNavigation.on('click', $.proxy(function() {
                var currentIndex = parseInt(this.activeContentWrapper.attr('data-index')) - 1;

                if (currentIndex < 0) {
                    if (this.config.infiniteLoop) {
                        currentIndex = this.slides.length - 1;
                    } else {
                        currentIndex = 0;
                    }
                }

                var currentPageIndex = Math.floor(currentIndex / this.config.displayedSlides);

                this.navigationTypeTriggered = 'pages';
                this.changeSlide(currentPageIndex * this.config.displayedSlides);
                this.updateAriabox(this.config.labels.navigationPrevAria);
                this.stopAutoplay();

                this.slides
                    .removeClass(this.classes.states.active)
                    .eq(currentIndex)
                    .addClass(this.classes.states.active)
                    .find('.' + this.classes.sliderActiveContentTrigger).click();

                this.activeContentWrapper.attr('data-index', currentIndex);
            }, this));

            this.nextActiveContentNavigation.on('click', $.proxy(function() {
                var currentIndex = parseInt(this.activeContentWrapper.attr('data-index')) + 1;

                if (currentIndex >= this.slides.length) {
                    if (this.config.infiniteLoop) {
                        currentIndex = 0;
                    } else {
                        currentIndex = this.slides.length;
                    }
                }

                var currentPageIndex = Math.floor(currentIndex / this.config.displayedSlides);

                this.navigationTypeTriggered = 'pages';
                this.changeSlide(currentPageIndex * this.config.displayedSlides);
                this.updateAriabox(this.config.labels.navigationNextAria);
                this.stopAutoplay();

                this.slides
                    .removeClass(this.classes.states.active)
                    .eq(currentIndex)
                    .addClass(this.classes.states.active)
                    .find('.' + this.classes.sliderActiveContentTrigger).click();

                this.activeContentWrapper.attr('data-index', currentIndex);
            }, this));
        },

        swipe: function() {
            this.detectswipe(this.slider, $.proxy(function(direction) {
                this.stopAutoplay();
                this.changeSlide(this.activeSlideIndex + (direction === 'left' ? 1 : -1));
            }, this));
        },

        // Initialize autoplay
        autoplay: function() {
            this.isAutoplay = true;

            this.createAutoplayButton();
            this.toggleAutoplayText();

            if (this.autoplayInterval) clearInterval(this.autoplayInterval);

            this.autoplayInterval = setInterval($.proxy(function() {
                if (!this.mouseHover) {
                    this.changeSlide(this.activeSlideIndex + 1);
                    if (this.isActiveContent) {
                        this.slides.eq(this.activeSlideIndex + 1).find('.' + this.classes.sliderActiveContentTrigger).click();
                    }
                }
            }, this), this.config.autoplayDelay);
        },

        stopAutoplay: function() {
            this.isAutoplay = false;

            clearInterval(this.autoplayInterval);

            // Remove active class on autoplay button
            if (this.autoplayButton !== undefined) {
                this.autoplayButton.removeClass(this.classes.states.active);
                this.toggleAutoplayText();
            }
        },

        // Create autoplay button
        createAutoplayButton: function() {
            var button = '<button class="' + this.classes.autoplayButton + ' ' + this.classes.states.active + '"><span class="">' + this.labels.autoplayButton + '</span></button>';

            if (this.sliderNavigation.find('.' + this.classes.autoplayButton).length < 1) {
                this.sliderNavigation.append(button);
                this.bindEventsAutoplayButton();
            }
        },

        bindEventsAutoplayButton: function() {
            this.autoplayButton = this.sliderNavigation.find('.' + this.classes.autoplayButton);
            this.autoplayButton.on('click', $.proxy(function() {
                if (this.isAutoplay) {
                    this.stopAutoplay();
                } else {
                    this.mouseHover = false;
                    this.autoplay();
                }
            }, this));
        },

        // Toggle aria text of autoplay button
        toggleAutoplayText: function() {
            if (this.sliderNavigation.find('.' + this.classes.autoplayButton).length > 0) {
                if (this.isAutoplay) {
                    this.autoplayButton.find('span').text(this.labels.autoplayButtonPause);
                } else {
                    this.autoplayButton.find('span').text(this.labels.autoplayButton);
                }
            }
        },

        // Create aria hidden box
        createAriabox: function() {
            if (this.config.createArrowsNavigation) {
                this.slider.append('<div class="visuallyhidden ' + this.classes.ariaHiddenBox + '" aria-live="polite" aria-atomic="true" aria-hidden="true"></div>');
                this.ariaHiddenBox = this.slider.find('.' + this.classes.ariaHiddenBox);
            }
        },

        // Update aria hidden box
        updateAriabox: function(content) {
            if (this.config.createArrowsNavigation) {
                this.ariaHiddenBox.html(content);
            }
        },

        // Change active slide
        changeSlide: function(index) {
            // Prevent slide outside the wrapper
            if (index < 0) {
                if (this.config.infiniteLoop) {
                    index = this.slides.length - this.config.displayedSlides;
                } else {
                    index = 0;
                }
            } else if (index > this.slides.length - this.config.displayedSlides) {
                if (this.navigationTypeTriggered === 'pages') {
                    index = this.slides.length - this.config.displayedSlides;
                } else {
                    if (this.config.infiniteLoop) {
                        index = 0;
                    } else {
                        index = this.slides.length - this.config.displayedSlides;
                    }
                }
            }

            // Add class on active slide if config is set to true
            if (this.config.addActiveClass) {
                this.slides.removeClass(this.classes.states.active);
                $(this.slides[index]).addClass(this.classes.states.active);
            }

            // Only animated if there is no active animation
            if (!this.isAnimated) {
                this.changeSlideAnimation(index);
            }
        },

        // Change active slide animation
        changeSlideAnimation: function(index) {
            var direction = (this.activeSlideIndex < index ? 'next' : 'prev');
            var focusableElements = 'a, button, :input, [tabindex]';
            this.isAnimated = true;

            this.config.onChangeSlideBefore(direction, $(this.slides[index]));

            // Change slide animation
            this.sliderContainer.animate({
                left: 100 / this.config.displayedSlides * index * -1 + '%'
            }, this.config.animationSpeed, $.proxy(function() {
                this.isAnimated = false;

                // Update active slide index
                this.activeSlideIndex = index;

                this.slides.find(focusableElements).attr('tabindex', '-1');
                this.slides.slice(index, index + this.config.displayedSlides).find(focusableElements).removeAttr('tabindex');

                if (this.config.createArrowsNavigation || this.config.createPagesNavigation) {
                    this.updateSlidesNavigation();
                }

                this.config.onChangeSlideAfter(direction, $(this.slides[this.activeSlideIndex]));
            }, this));
        },

        // Update navigation active elements
        updateSlidesNavigation: function() {
            if (this.config.createPagesNavigation) {
                // Get current active page index
                var currentPageIndex = this.activeSlideIndex / this.config.displayedSlides;
                var currentPageIndexRounded = Math.floor(currentPageIndex);

                if (currentPageIndex === this.slides.length / this.config.displayedSlides - 1) {
                    currentPageIndexRounded = this.pagesNavigation.length - 1;
                }
                // Update pages buttons active class
                this.pagesNavigation.removeClass(this.classes.states.active).eq(currentPageIndexRounded).addClass(this.classes.states.active);

                // Update hidden active text
                this.pagesNavigation.find('.' + this.classes.ariaTextActive).remove();
                this.pagesNavigation.eq(currentPageIndexRounded).append('<span class="visuallyhidden ' + this.classes.ariaTextActive + '">' + this.labels.pagesNavigationActive + '</span>');
            }
        },

        detectswipe: function(element, callback) {
            var min_x = 30;
            var max_x = 30;
            var min_y = 50;
            var max_y = 60;
            var direction = '';
            var swipe_det = new Object();

            swipe_det.sX = 0;
            swipe_det.sY = 0;
            swipe_det.eX = 0;
            swipe_det.eY = 0;

            element = element[0];

            element.addEventListener('touchstart', function(e) {
                var t = e.touches[0];
                swipe_det.sX = t.screenX;
                swipe_det.sY = t.screenY;
            }, false);

            element.addEventListener('touchmove', function(e) {
                var t = e.touches[0];
                swipe_det.eX = t.screenX;
                swipe_det.eY = t.screenY;
                e.preventDefault();
            }, false);

            element.addEventListener('touchend', function() {
                if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y) && (swipe_det.eX > 0)))) {
                    if (swipe_det.eX > swipe_det.sX) direction = 'right';
                    else direction = 'left';
                } else if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x) && (swipe_det.eY > 0)))) {
                    if (swipe_det.eY > swipe_det.sY) direction = 'down';
                    else direction = 'up';
                }
                if (direction != '') {
                    if (typeof callback == 'function') callback(direction);
                }
                direction = '';
                swipe_det.sX = 0;
                swipe_det.sY = 0;
                swipe_det.eX = 0;
                swipe_det.eY = 0;
            }, false);
        },

        // Check if slider has active content attribute set to true
        isActiveContent: function() {
            return this.slider.data('active-content') !== undefined;
        },

        getUrlParameter: function(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1));
            var sURLVariables = sPageURL.split('&');
            var sParameterName;
            var i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        }

    });

    $.fn.slider = function(options) {
        this.each($.proxy(function(index, element) {
            var $element = $(element);

            // Return early if this $element already has a plugin instance
            if ($element.data('slider')) return;

            // Pass options to plugin constructor
            var slider = new Slider(element, options);

            // Add every public methods to plugin
            for (var key in slider.publicMethods) {
                this[key] = slider.publicMethods[key];
            }

            // Store plugin object in this $element's data
            $element.data('slider', slider);
        }, this));

        return this;
    };
})(jQuery);