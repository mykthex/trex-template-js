// Form jQuery Plugin
// A form validation plugin using is.js

(function($) {
    var CustomFormValidation = function(element, options) {
        this.customFormValidation = $(element);

        this.config = $.extend({
            focusTopSubmit: true,
            modifiers: {
                '!': 'not'
            },
            customGlobalClasses: {},
            customFunctions: {}
        }, options || {});

        this.classes = $.extend({
            active: 'is-active',
            open: 'is-open',
            hover: 'is-hover',
            clicked: 'is-clicked',
            extern: 'is-external',
            error: 'is-error'
        }, this.config.customGlobalClasses || {});

        this.errors = [];

        this.publicMethods = {
            newError: $.proxy(function(input, message) {
                this.newError(input, message);
                this.displayErrors();
            }, this),
            resetErrors: $.proxy(function() {
                this.resetErrors();
            }, this)
        };

        this.init();
    };

    $.extend(CustomFormValidation.prototype, {

        // Component initialization
        init: function() {
            this.bindEvents();
        },

        // Bind events with actions
        bindEvents: function() {
            this.customFormValidation.on('submit', $.proxy(function(e) {
                this.resetErrors();
                this.validate();
                this.displayErrors();
                if (this.errors.length > 0) {
                    e.preventDefault();
                    this.customFormValidation.trigger('submitErrors');
                } else {
                    this.customFormValidation.trigger('submitSuccess');
                }
            }, this));
        },

        // Bind errors events with actions
        bindErrorsEvents: function() {
            // Scroll and focus input on error click
            this.customFormValidation.find('.errors a').on('click', $.proxy(function(e) {
                var label = this.customFormValidation.find(e.currentTarget.hash).parents('.field').find('label'),
                    input = this.customFormValidation.find(e.currentTarget.hash);
                input.focus();
                $(window).scrollTop(label.offset().top);
                e.preventDefault();
            }, this));
        },

        // Catch form submit and validate values
        validate: function() {
            var inputs = this.customFormValidation.find('input, textarea, select, fieldset');
            this.errors = [];
            inputs.each($.proxy(function(index, input) {
                if (input.tagName.toLowerCase() === 'fieldset') {
                    this.validateFieldset(input);
                } else {
                    this.validateInput(input);
                }
            }, this));
        },

        // Validate current input
        validateInput: function(input) {
            var data = $(input).val();
            var value = this.isNumber(data) ? parseInt(data) : data;
            var validationTerms = this.getValidationTerms(input);
            var empty = false;
            var $comparingField;
            var $input;

            if (validationTerms) {
                _.each(validationTerms, $.proxy(function(validationTerm) {
                    var valid = true,
                        term = this.getTerm(validationTerm),
                        modifier = this.getModifier(validationTerm),
                        compare = this.getCompare(input, term);
                    if (!this.isNumber(value) && this.isNumber(compare)) {
                        value = value.length;
                    }
                    if (term === 'field') {
                        $comparingField = $(compare);
                        $input = $(input);
                        if ($input.val() != $comparingField.val()) {
                            valid = false;
                        }
                    } else {
                        if (term === 'regex') {
                            var regex = new RegExp(compare);
                            valid = regex.test(value);
                        } else if (modifier !== false && is[modifier][term]) {
                            valid = is[modifier][term](value, compare) ? valid : false;
                        } else if (is[term]) {
                            valid = is[term](value, compare) ? valid : false;
                        } else if (this.config.customFunctions[term]){
                            valid = this.config.customFunctions[term](value, compare) ? (modifier != 'not' ? true : false ) : (modifier != 'not' ? false : true );
                        } else {
                            console.warn('Form comparison function'+(modifier?' '+modifier:'')+' '+term+' does not exists.');
                        }
                    }
                    if (!valid && term === 'empty') {
                        empty = true;
                        this.newError(input, this.getErrorMessage(input, term));
                    }
                    if (!valid && !empty) {
                        this.newError(input, this.getErrorMessage(input, term));
                    }
                }, this));
            }
        },

        // Validate current fieldset (for radio button and checkboxes)
        validateFieldset: function(fieldset) {
            var $fieldset = $(fieldset);
            var inputs = $fieldset.find('input');
            var validationTerms = this.getValidationTerms(fieldset);
            var checkedElements = [];
            var empty = false;
            var isRanges = false;

            inputs.each(function(index, el) {
                if ($(el).is(':checked')) {
                    checkedElements.push(el);
                } else {
                    if ($fieldset.data('ranges') === true) {
                        isRanges = true;
                        // Handle ranges input
                        if ($(el).val() !== '0') {
                            checkedElements.push(el);
                        }
                    }
                }
            });

            if (validationTerms) {
                _.each(validationTerms, $.proxy(function(validationTerm) {
                    var valid = true,
                        term = this.getTerm(validationTerm),
                        modifier = this.getModifier(validationTerm),
                        compare = this.getCompare(fieldset, term);
                    if (term === 'empty') {
                        if (modifier !== false && is[modifier][term]) {
                            valid = is[modifier][term](checkedElements, compare) ? valid : false;
                            // If ranges checked for all empty
                            if (isRanges === true && checkedElements.length !== inputs.length) {
                                valid = false;
                            }
                        } else if(is[term]) {
                            valid = is[term](checkedElements, compare) ? valid : false;
                        } else {
                            console.warn('Form comparison function'+(modifier?' '+modifier:'')+' '+term+' does not exists.');
                        }
                        if (!valid) {
                            empty = true;
                            this.newFieldsetError(fieldset, this.getErrorMessage(fieldset, term));
                        }
                    } else {
                        if (modifier !== false && is[modifier][term]) {
                            valid = is[modifier][term](checkedElements.length, compare) ? valid : false;
                        } else if (is[term]) {
                            valid = is[term](checkedElements.length, compare) ? valid : false;
                        } else {
                            console.warn('Form comparison function'+(modifier?' '+modifier:'')+' '+term+' does not exists.');
                        }
                        if (!valid && !empty) {
                            this.newFieldsetError(fieldset, this.getErrorMessage(fieldset, term));
                        }
                    }
                }, this));
            }
        },

        // Get validation terms
        getValidationTerms: function(input) {
            var data = $(input).attr('data-validate');
            return data !== undefined ? data.trim().split(' ') : false;
        },

        // Normalize given term name
        getTerm: function(term) {
            return term.charAt(0) === '!' ? term.substring(1) : term;
        },

        // Get term modifier
        getModifier: function(term) {
            var modifier = this.config.modifiers[term.charAt(0)];
            return modifier !== undefined ? modifier : false;
        },

        // Get term comparison value
        getCompare: function(input, term) {
            var data = $(input).data('compare-' + term.toLowerCase());
            if (data === undefined) return null;
            return this.isNumber(data) ? parseInt(data) : data;
        },

        // Get term error message
        getErrorMessage: function(input, term) {
            var data = $(input).data('message-' + term.toLowerCase());
            return data !== undefined ? data : '';
        },

        // Reset form errors
        resetErrors: function() {
            $('.errors').html('');
            this.customFormValidation.find('.field').removeClass(this.classes.error);
            this.customFormValidation.find('.error-message, .error-message-explanation').remove();
        },

        // Throw new input error
        newError: function(input, message) {
            var id = $(input).attr('id'),
                label = this.customFormValidation.find('label[for="' + id + '"]'),
                field = label.parents('.field').eq(0),
                markup = '<a href="#' + id + '">' + message + '</a>';

            field.addClass(this.classes.error);
            if (label.find('.error-message').length === 0) {
                label.prepend('<span class="error-message">' + this.customFormValidation.data('errors-prefix') + '</span>');
            }
            label.append('<span class="error-message-explanation"><span>' + message + '</span></span>');
            this.errors.push(markup);
        },

        // Throw new fieldset error
        newFieldsetError: function(fieldset, message) {
            var $fieldset = $(fieldset),
                id = $fieldset.attr('id'),
                legend = $fieldset.find('legend'),
                markup = '<a href="#' + id + '">' + message + '</a>';

            $fieldset.addClass(this.classes.error);
            if (legend.find('.error-message').length === 0) {
                legend.prepend('<span class="error-message">' + this.customFormValidation.data('errors-prefix') + '</span>');
            }
            legend.append('<span class="error-message-explanation"><span>' + message + '</span></span>');
            this.errors.push(markup);
        },

        // Display errors summary
        displayErrors: function() {
            this.customFormValidation.find('.errors').remove();
            if (this.errors.length > 0) {
                this.customFormValidation.prepend('<div class="errors"></div>');
                this.customFormValidation.errors = this.customFormValidation.find('> .errors');
                this.customFormValidation.errors.append('<p>' + this.customFormValidation.data('errors-message').replace('{n}', this.errors.length).replace('{s}', this.errors.length > 1 ? 's' : '') + '</p>');
                this.customFormValidation.errors.append('<ul></ul>');
                this.customFormValidation.errorsList = this.customFormValidation.find('> .errors > ul');
                _.each(this.errors, $.proxy(function(error) {
                    this.customFormValidation.errorsList.append('<li>' + error + '</li>');
                }, this));
                // Focus on errors field
                if (this.config.focusTopSubmit === true) {
                    var errorDiv = this.customFormValidation.find('.errors');
                    errorDiv.attr('tabindex', -1);
                    setTimeout($.proxy(function() {
                        errorDiv.focus();
                    }, this), 0);
                }
                // Bind errors events
                this.bindErrorsEvents();
            }
        },

        // Check if given value is a number
        isNumber: function(value) {
            if (!value) return false;
            return value.toString().match(/^[0-9]+$/) && !isNaN(parseInt(value));
        }
    });


    $.fn.customFormValidation = function(options) {
        this.each($.proxy(function(index, element) {
            var $element = $(element);

            // Return early if this $element already has a plugin instance
            if ($element.data('custom-form-validation')) return;

            // Pass options to plugin constructor
            var customFormValidation = new CustomFormValidation(element, options);

            // Add every public methods to plugin
            for (var key in customFormValidation.publicMethods) {
                this[key] = customFormValidation.publicMethods[key];
            }

            // Store plugin object in this $element's data
            $element.data('custom-form-validation', customFormValidation);
        }, this));

        return this;
    };
})(jQuery);