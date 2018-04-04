// Folder jQuery Plugin
// A jQuery folder plugin

(function($) {
    var Folder = function(element, options) {
        this.folderGroup = $(element);

        // Default module configuration
        this.defaults = {
            animation: 'linear',
            animationDuration: 400,
            openFirstFolder: true,
            singleOpen: true,
            onFocus: $.noop,
            beforeOpen: $.noop,
            afterOpen: $.noop,
            beforeClose: $.noop,
            afterClose: $.noop,
            onBlur: $.noop,
            labels: {
                ariaOpen: 'Cliquer pour ouvrir',
                ariaClose: 'Cliquer pour fermer'
            },
            classes: {
                ariaText: 'aria-text',
                forceOpen: 'is-default-open',
                folder: 'folder',
                folderGroup: 'folder-group',
                folderTrigger: 'folder-trigger',
                folderContent: 'folder-content',
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

        // Get all the folders
        this.folders = this.folderGroup.find('.' + this.classes.folder);

        // Get all the folders triggers and transform them into <button> tag
        this.folderGroup.find('.' + this.classes.folderTrigger).buttonize({
            a11y: this.config.a11y
        });

        // Get all the folders triggers and add type button so no submit is triggered
        this.folderGroup.find('.' + this.classes.folderTrigger).attr('type', 'button');

        // Get all the folders triggers
        this.folderTriggers = this.folderGroup.find('.' + this.classes.folderTrigger);

        // Get all the folders contents
        this.folderContents = this.folderGroup.find('.' + this.classes.folderContent);

        // Check for aria and labels on the HTML element - overwrite JS config
        this.updatePluginText();

        // Create and get the aria text for all folders triggers
        this.folderTriggers.append('<span aria-live="polite" class="' + this.classes.ariaText + ' visuallyhidden">' + this.labels.ariaOpen + '</span>');
        this.folderArias = this.folderTriggers.find('.' + this.classes.ariaText);

        this.init();
    };

    $.extend(Folder.prototype, {
        // Component initialization
        init: function() {
            this.bindEvents();
            // Check if each element has to be open or close
            this.folders.each($.proxy(function(index, element) {
                var $element = $(element);
                // Find elements of current tab
                currentAriaContainer = $element.find('.' + this.classes.ariaText);
                currentContent = $element.find('.' + this.classes.folderContent);
                // If has force open class or not
                if (!$element.hasClass(this.classes.forceOpen)) {
                    currentContent.hide();
                    this.changeAriaText(currentAriaContainer, this.labels.ariaOpen);
                } else {
                    $element.addClass(this.classes.states.active);
                    this.changeAriaText(currentAriaContainer, this.labels.ariaClose);
                }
            }, this));
            // If first folder has to be open
            if (this.config.openFirstFolder) {
                this.openFirstFolder();
            }
        },

        // Bind events with actions
        bindEvents: function() {
            // Folder trigger click event (open or close)
            this.folderTriggers.on('click', $.proxy(function(e) {
                // If folder is opened or not
                if ($(e.currentTarget).closest('.' + this.classes.folder).hasClass(this.classes.states.active)) {
                    this.closeFolder($(e.currentTarget));
                } else {
                    this.openFolder($(e.currentTarget));
                }
            }, this));

            // On blur and focuse change aria-live value
            this.folderTriggers.on('focus', $.proxy(function(e) {
                this.onTriggerFocus($(e.currentTarget));
            }, this));
            this.folderTriggers.on('blur', $.proxy(function(e) {
                this.onTriggerBlur($(e.currentTarget));
            }, this));
            // On blur and focuse custom config function call
            this.folderTriggers.on('focus', this.config.onFocus);
            this.folderTriggers.on('blur', this.config.onBlur);
        },

        updatePluginText: function() {
            // Loop through labels in config
            $.each(this.config.labels, $.proxy(function(labelKey, labelText) {
                // Loop through labels in element data attributes to see if it's set
                $.each(this.folderGroup.data(), $.proxy(function(dataLabelKey, dataLabelText) {
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

        // Open the current folder
        openFolder: function(currentTrigger) {
            // Custom config function call
            this.config.beforeOpen();
            // Find elements of current tab
            currentAriaContainer = currentTrigger.find('.' + this.classes.ariaText);
            currentFolder = currentTrigger.closest('.' + this.classes.folder);
            currentContent = currentFolder.find('.' + this.classes.folderContent);
            // Add class active to the folder and remove on others
            if (this.config.singleOpen == true) {
                this.folders.removeClass(this.classes.states.active)
            }
            currentFolder.addClass(this.classes.states.active);

            // With animation
            if (this.config.animation !== 'none') {
                // If singleopen option set to true close every folders
                if (this.config.singleOpen == true) {
                    this.folderContents.slideUp(this.config.animationDuration);
                    this.changeAriaText(this.folderArias, this.labels.ariaOpen);
                }
                currentContent.slideDown(this.config.animationDuration, $.proxy(function() {
                    // Custom config function call
                    this.config.afterOpen();
                }, this));
            }
            // Without animation
            else {
                // If singleopen option set to true close every folders
                if (this.config.singleOpen == true) {
                    this.folderContents.hide();
                    this.changeAriaText(this.folderArias, this.labels.ariaOpen);
                }
                currentContent.show();
                // Custom config function call
                this.config.afterOpen();
            }
            this.changeAriaText(currentAriaContainer, this.labels.ariaClose);
        },

        // Close the current folder
        closeFolder: function(currentTrigger) {
            // Custom config function call
            this.config.beforeClose();
            // Find elements of current tab
            currentAriaContainer = currentTrigger.find('.' + this.classes.ariaText);
            currentFolder = currentTrigger.closest('.' + this.classes.folder);
            currentContent = currentFolder.find('.' + this.classes.folderContent);
            // Remove class active
            currentFolder.removeClass(this.classes.states.active);

            // With animation
            if (this.config.animation !== 'none') {
                currentContent.slideUp(this.config.animationDuration, $.proxy(function() {
                    // Custom config function call
                    this.config.afterClose();
                }, this));
            }
            // Without animation
            else {
                currentContent.hide();
                // Custom config function call
                this.config.afterClose();
            }
            this.changeAriaText(currentAriaContainer, this.labels.ariaOpen);
        },

        // Open first folder
        openFirstFolder: function() {
            var firstFolder = this.folders.first();
            firstFolder.find('.' + this.classes.folderContent).show();
            firstFolder.addClass(this.classes.states.active);
            this.changeAriaText(firstFolder.find('.' + this.classes.ariaText), this.labels.ariaClose);
        },

        // closeAllFolder
        closeAll: function() {
            var element = this;
            for (var i = 0; i < this.folders.length; i++) {
                var $this = $(this.folders[i]);

                // Find elements of current tab
                currentTrigger = $this.find('.' + this.classes.folderTrigger);
                currentAriaContainer = currentTrigger.find('.' + this.classes.ariaText);
                currentFolder = currentTrigger.closest('.' + this.classes.folder);
                currentContent = currentFolder.find('.' + this.classes.folderContent);
                // Remove class active
                currentFolder.removeClass(this.classes.states.active);
                currentContent.hide();
                element.changeAriaText(currentAriaContainer, this.labels.ariaOpen);
            }
        },

        // Change aria text of a folder
        changeAriaText: function(element, ariaText) {
            element.text(ariaText);
        },

        // Change aria-live attribute on focus
        onTriggerFocus: function(trigger) {
            trigger.find('.' + this.classes.ariaText).attr('aria-live', 'polite');
        },

        // Change aria-live attribute on blur
        onTriggerBlur: function(trigger) {
            trigger.find('.' + this.classes.ariaText).removeAttr('aria-live');
        }
    });

    $.fn.folder = function(options) {
        return this.each(function() {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('folder')) return;

            // pass options to plugin constructor
            var folder = new Folder(this, options);

            // Store plugin object in this element's data
            element.data('folder', folder);
        });
    };
})(jQuery);