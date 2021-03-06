/*!
 * angular-twbs-combobox
 * http://insert_github_here
 * Version: 1.0
 * License: MIT
 */

/* SPECIAL THANKS TO Daniel Farrell FOR HIS FANTASTIC BOOTSTRAP COMBOBOX! */

/* =============================================================
 * bootstrap-combobox.js v1.1.6
 * =============================================================
 * Copyright 2012 Daniel Farrell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function ($) {

    "use strict";

    /* COMBOBOX PUBLIC CLASS DEFINITION
     * ================================ */

    var Combobox = function (element, options) {
        this.options = $.extend({}, $.fn.combobox.defaults, options);
        this.$source = $(element);
        this.$container = this.setup();
        this.$element = this.$container.find('input[type=text]');
        this.$target = this.$container.find('input[type=hidden]');
        this.$button = this.$container.find('.dropdown-toggle');
        this.$menu = $(this.options.menu).appendTo('body');
        this.template = this.options.template || this.template
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.shown = false;
        this.selected = false;
        this.cleared = false;
        this.turnOffProcessOnce = false;
        this.focusCount = 0;
        this.externalSearch = false;
        this.refresh();
        this.transferAttributes();
        this.listen();
    };

    Combobox.prototype = {

        constructor: Combobox

        , setup: function () {
            var combobox = $(this.template());
            this.$source.after(combobox);
            this.$source.hide();
            return combobox;
        }

        , disable: function () {
            this.$element.prop('disabled', true);
            this.$button.attr('disabled', true);
            this.disabled = true;
            this.$container.addClass('combobox-disabled');
        }

        , enable: function () {
            this.$element.prop('disabled', false);
            this.$button.attr('disabled', false);
            this.disabled = false;
            this.$container.removeClass('combobox-disabled');
        }
        , parse: function () {
            var that = this
              , map = {}
              , source = []
              , selected = false
              , selectedValue = '';
            this.$source.find('option').each(function () {
                var option = $(this);
                if (option.val() === '') {
                    that.options.placeholder = option.html().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    return;
                }
                map[option.html()] = option.val();
                source.push(option.html().replace(/^\s\s*/, '').replace(/\s\s*$/, ''));
                if (option.prop('selected')) {
                    selected = option.html().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    selectedValue = option.val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
            })
            this.map = map;
            if (selected) {
                this.$element.val($(selected).text().replace(/^\s\s*/, '').replace(/\s\s*$/, ''));
                this.$target.val(selectedValue.replace(/^\s\s*/, '').replace(/\s\s*$/, ''));
                this.$container.addClass('combobox-selected');
                this.selected = true;
            }
            return source;
        }

        , transferAttributes: function () {
            this.options.placeholder = this.$source.attr('data-placeholder') || this.options.placeholder
            this.$element.attr('placeholder', this.options.placeholder)
            this.$target.prop('name', this.$source.prop('name'))
            this.$target.val(this.$source.val())
            this.$source.removeAttr('name')  // Remove from source otherwise form will pass parameter twice.
            this.$element.attr('required', this.$source.attr('required'))
            this.$element.attr('rel', this.$source.attr('rel'))
            this.$element.attr('title', this.$source.attr('title'))
            this.$element.attr('class', this.$source.attr('class'))
            this.$element.attr('tabindex', this.$source.attr('tabindex'))
            this.$source.removeAttr('tabindex')
            if (this.$source.attr('disabled') !== undefined)
                this.disable();
        }

        , select: function () {
            var val = this.$menu.find('.active').attr('data-value');

            if (!val)
                val = this.$menu.find('li').attr('data-value');

            val = val.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); // clean spacing before and after string

            this.$element.val(this.updater($(val).text().replace(/^\s\s*/, '').replace(/\s\s*$/, ''))).trigger('change');
            this.$target.val(this.map[val]).trigger('change');
            this.$source.val(this.map[val]).trigger('change');
            this.$container.addClass('combobox-selected');
            this.selected = true;
            return this.hide();
        }

        , updater: function (item) {
            return item;
        }

        , show: function () {
            var pos = $.extend({}, this.$element.position(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu
              .insertAfter(this.$element)
              .css({
                  top: pos.top + pos.height
              , left: pos.left
              })
              .show();

            $('.dropdown-menu').on('mousedown', $.proxy(this.scrollSafety, this));

            this.shown = true;
            return this;
        }

        , hide: function () {
            this.$menu.hide();
            $('.dropdown-menu').off('mousedown', $.proxy(this.scrollSafety, this));
            this.$element.off('blur').on('blur', $.proxy(this.blur, this));

            this.shown = false;
            return this;
        }

        , lookup: function (event) {
            this.query = this.$element.val();
            
            if (this.externalSearch)
                this.$source.trigger('lookup', [this.query]);

            return this.process(this.source);
        }

        , process: function (items) {
            if (!this.turnOffProcessOnce)
            {
                var that = this;

                items = $.grep(items, function (item) {
                    return that.matcher(item);
                })

                items = this.sorter(items);

                if (!items.length) {
                    return this.shown ? this.hide() : this;
                }

                return this.render(items.slice(0, this.options.items)).show();
            }

            this.turnOffProcessOnce = false;
        }

        , template: function () {
            if (this.options.bsVersion == '2') {
                return '<div class="combobox-container"><input type="hidden" /> <div class="input-append"> <input type="text" autocomplete="off" /> <span class="add-on dropdown-toggle" data-dropdown="dropdown"> <span class="caret"/> <i class="icon-remove"/> </span> </div> </div>'
            } else {
                return '<div class="combobox-container"> <input type="hidden" /> <div class="input-group"> <input type="text" autocomplete="off" /> <span class="input-group-addon dropdown-toggle" data-dropdown="dropdown"> <span class="caret" /> <span class="glyphicon glyphicon-remove" /> </span> </div> </div>'
            }
        }

        , matcher: function (item) {
            if (this.externalSearch)
                return true;

            var itemText = $(item).text();

            if (this.$button.is(":visible")) // dropdown is available
                return ~itemText.toLowerCase().indexOf(this.query.toLowerCase());
            else
                return ~itemText.toLowerCase().indexOf(this.query.toLowerCase()) && this.query !== "";
        }

        , sorter: function (items) {

            var beginswith = []
              , caseSensitive = []
              , caseInsensitive = []
              , item;

            while (item = items.shift()) {
                if (!item.toLowerCase().indexOf(this.query.toLowerCase())) { beginswith.push(item); }
                else if (~item.indexOf(this.query)) { caseSensitive.push(item); }
                else { caseInsensitive.push(item); }
            }

            return beginswith.concat(caseSensitive, caseInsensitive);
        }

        , highlighter: function (item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>';
            })
        }

        , render: function (items) {
            var that = this;

            items = $(items).map(function (i, item) {
                i = $(that.options.item).attr('data-value', item);

                if (typeof $(item.replace(/<!--(?!>)[\S\s]*?-->/g, '')).attr('override') !== typeof undefined && $(item.replace(/<!--(?!>)[\S\s]*?-->/g, '')).attr('override') !== false)
                    i.find('a').parent().html(item);
                else if ($(item).is("a"))
                    i.find('a').parent().html(item);
                else
                    i.find('a').html(item);

                return i[0];
            })

            items.first().addClass('active');
            this.$menu.html(items);
            return this;
        }

        , next: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
              , next = active.next();

            if (!next.length) {
                next = $(this.$menu.find('li')[0]);
            }

            next.addClass('active');
        }

        , prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
              , prev = active.prev();

            if (!prev.length) {
                prev = this.$menu.find('li').last();
            }

            prev.addClass('active');
        }

        , toggle: function () {
            if (!this.disabled) {
                if (this.$container.hasClass('combobox-selected')) {
                    this.clearTarget();
                    this.triggerChange();
                    this.clearElement();
                } else {
                    if (this.shown) {
                        this.hide();
                    } else {
                        this.clearElement();
                        this.lookup();
                    }
                }
            }
        }
        , clear: function () {
            this.clearTarget();
            this.triggerChange();
            this.clearElement();
        }

        , scrollSafety: function (e) {
            if (e.target.tagName == 'UL') {
                this.$element.off('blur');
            }
        }
        , clearElement: function () {
            this.$element.val('');
        }

        , clearTarget: function () {
            this.cleared = true;
            this.$source.val('');
            this.$target.val('');
            this.$container.removeClass('combobox-selected');
            this.$container.find('.active').removeClass('active');
            this.selected = false;
        }

        , triggerChange: function () {
            this.$source.trigger('change');
        }

        , refresh: function () {
            this.source = this.parse();
            this.options.items = this.source.length;

            if (this.externalSearch)
                this.process(this.source);
        }

        , listen: function () {

            this.$container
                .on('click', $.proxy(this.bodyClick, this));

            this.$element
              .on('focus', $.proxy(this.focus, this))
              .on('blur', $.proxy(this.blur, this))
              .on('keypress', $.proxy(this.keypress, this))
              .on('keyup', $.proxy(this.keyup, this));

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this));
            }

            this.$menu
              .on('click', $.proxy(this.click, this))
              .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
              .on('mouseleave', 'li', $.proxy(this.mouseleave, this));

            this.$button
              .on('click', $.proxy(this.toggle, this));
        }

        , eventSupported: function (eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;');
                isSupported = typeof this.$element[eventName] === 'function';
            }
            return isSupported;
        }

        , move: function (e) {
            if (!this.shown) { return; }

            switch (e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break;
            }

            e.stopPropagation();
        }

        , keydown: function (e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 9, 13, 27]);
            this.move(e);
        }

        , keypress: function (e) {
            if (this.suppressKeyPressRepeat) { return; }
            this.move(e);
        }

        , keyup: function (e) {
            switch (e.keyCode) {
                case 40: // down arrow
                case 39: // right arrow
                case 38: // up arrow
                case 37: // left arrow
                case 36: // home
                case 35: // end
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break;

                case 9: // tab
                case 13: // enter
                    if (!this.shown) { return; }
                    this.select();
                    break;

                case 27: // escape
                    if (!this.shown) { return; }
                    this.hide();
                    break;

                default:
                    this.clearTarget();
                    this.lookup();
            }

            e.stopPropagation();
            e.preventDefault();
        }

        , focus: function (e) {
            if (this.focusCount > 0)
                this.$source.trigger("focusin"); // could not fire focus on select (fire any custom event)
            
            this.focused = true;

            this.focusCount += 1;
        }

        , blur: function (e) {
            var that = this;
            this.focused = false;
            var val = this.$element.val();
            if (!this.selected && val !== '') {
                this.$element.val('');
                this.$source.val('').trigger('change');
                this.$target.val('').trigger('change');
            }
            if (!this.mousedover && this.shown) { setTimeout(function () { that.hide(); }, 200); }

            setTimeout(function (arg) { arg.$source.trigger("blur"); }, 200, this);
        }

        , click: function (e) {
            var href = $(e.target).attr('href');

            if (typeof href === typeof undefined || href === false || href === "#" || href === "") {
                e.stopPropagation();
                e.preventDefault();
            }

            this.turnOffProcessOnce = true;

            this.select();
            this.$element.focus();
            this.cleared = false;
        }

        , mouseenter: function (e) {
            this.mousedover = true;
            this.$menu.find('.active').removeClass('active');
            $(e.currentTarget).addClass('active');
        }

        , mouseleave: function (e) {
            this.mousedover = false;
        }

        , bodyClick: function (e) {
            this.$source.trigger('bodyClick');
        }
    };

    /* COMBOBOX PLUGIN DEFINITION
     * =========================== */
    $.fn.combobox = function (option) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('combobox')
              , options = typeof option == 'object' && option;
            if (!data) { $this.data('combobox', (data = new Combobox(this, options))); }
            if (typeof option == 'string') { data[option](); }
        });
    };

    $.fn.combobox.defaults = {
        bsVersion: '3'
    , menu: '<ul class="typeahead typeahead-long dropdown-menu"></ul>'
    , item: '<li><a href="#"></a></li>'
    };

    $.fn.combobox.Constructor = Combobox;

}(window.jQuery);

(function () {
    "use strict";

    var module = angular.module('angular.twbs.combobox', []);

    module.directive("ngTwbsCombobox", ['$timeout', function ($timeout) {

        var focused = false;

        return {
            restrict: "E",
            replace: true,
            scope: {
                collection: "=",
                selected: "=",
                onChange: "&",
                onFocus: "&",
                onBlur: "&",
                onLookup: "&",
                onBodyClick: "&",
            },
            transclude: true,
            template: "<select class='combobox'><option ng-repeat='item in collection' value='{{$index}}' ng-transclude></option></select>",
            link: function (scope, element, attrs) {
                scope.$watchCollection('collection', function () {

                    $timeout(function () {

                        if (element.siblings(".combobox-container").length > 0) {
			                element.val([]);
			                element.data('combobox').refresh();
                        }
                        else {
                            element.combobox();
                        }

                        if ("onLookup" in attrs)
                            element.data('combobox').externalSearch = true;
                        
                        // attach event bindings
                        element.off('bodyClick').on('bodyClick', function (e) {
                            scope.$apply(function () {
                                scope.onBodyClick();
                            });
                        });

                        element.off('change').on('change', function (e) {
                            var index = element.siblings(".combobox-container").children("input[type='hidden']").val();

                            if (index !== "" && index > -1)
                                scope.selected = scope.collection[index];
                            else
                                scope.selected = undefined;

                            if (index !== "") {
                                scope.$apply(function () {
                                    scope.onChange({ selected: scope.selected });
                                });
                            }
                        });

                        element.off('blur').on('blur', function (e) {
                            if (focused && !element.data('combobox').shown && !element.data("combobox").cleared) {

                                focused = false;

                                scope.$apply(function () {
                                    scope.onBlur();
                                });
                            }
                        });

                        element.off('focusin').on('focusin', function (e) {
                            if (!focused) {
                                focused = true;

                                scope.$apply(function () {
                                    scope.onFocus();
                                });
                            }
                        });

                        element.off('lookup').on('lookup', function (e, query) {
                            scope.$apply(function () {
                                scope.onLookup({ query: query });
                                element.data('combobox').show();
                            });

                            
                        });
                    });
                });

                scope.$watch('selected', function () {
                    $timeout(function () {
                        if (scope.selected) {
                            var selectedIndex = scope.collection.indexOf(scope.selected);
                            element.val(selectedIndex);
                            element.data('combobox').refresh();
                        } else if (element.siblings(".combobox-container").length > 0) {
                            element.data('combobox').clear();
                        }
                    });
                });
            }
        };
    }]);
}());