var Backbone = require('backbone');
var jQuery = require('jquery');
var $ = jQuery;
var _ = require('underscore');
var toastr = require('toastr');

require("jqueryui");
require("jquery-jcrop");
require('backbone.localstorage');
require("bootstrap");

$(document).ready(function () {
    // Set up toastr how we want it
    toastr.options = {
        "positionClass": "toast-bottom-right"
    };

    // Files are always created on the server. All we need here
    // is idAttribute so backbone knows what the id field is
    var File = Backbone.Model.extend({ idAttribute: "fullname" });

    // FileCollections are very simple but we need to specify
    // the url and model type
    var FileCollection = Backbone.Collection.extend({
        url: 'file',
        model: File
    });

    // Diagnostics runs basic tests to establish if this might work or not
    var Diagnostics = Backbone.Model.extend({ url: 'diagnostics' });

    // Device contains information about the scanner itself
    var Device = Backbone.Model.extend({ url: 'device' });

    // ScanRequest is what gets sent to the scanner and contains
    // the various fields which define what the scanner will do
    var ScanRequest = Backbone.Model.extend({
        defaults: function () {
            return {
                // LocalStorage requires an id in order to
                // update / read. This can be fixed to anything
                id: 0,
                top: 0,
                left: 0,
                width: 215,
                height: 297,
                resolution: 150,
                mode: null,
                brightness: 0,
                contrast: 0,
                convertFormat: 'tif',
                dynamicLineart: true
            };
        },

        initialize: function () {
            this.localStorage = new Backbone.LocalStorage('scanservjs');
        }
    });

    // Views
    var FileView = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#file-row').html()),
        events: {
            'click button': "clear"
        },

        render: function () {
            var json = this.model.toJSON();
            var html = this.template(json);
            this.$el.html(html);
            return this;
        },

        clear: function () {
            this.model.destroy();
            this.remove();
        }
    });

    var Page = Backbone.View.extend({
        diagnostics: null,
        device: null,
        files: null,
        resizeTimer: null,
        adf: null,

        el: $("#app"),
        tagName: 'div',
        template: _.template($('#page').html()),
        events: {
            'change input': 'update',
            'change select': 'update',
            'click #preview': 'preview',
            'click #reset': 'reset',
            'click #scan': 'scan'
        },

        mask: function () {
            $('#mask').fadeIn();
        },

        unmask: function () {
            $('#mask').fadeOut();
        },

        fail: function (xhr) {
            toastr.error(xhr.responseJSON.message);
        },

        reset: function () {
            var defaults = this.model.defaults();
            this.model.set(defaults);
            this.model.save();
            jcrop.draw();
        },

        // For debug only - but useful for when things
        // have gone a bit wrong
        clearStorage: function () {
            var ls = this.model.localStorage;
            var all = ls.findAll();
            for (var i = 0; i < all.length; i++) {
                var m = all[i];
                ls.destroy(m);
            }
        },

        // When a UI field is updated, its change event
        // should be propagated here. This will update
        // the model and forward updates to JcropManager
        update: function (event) {
            var field = event.target;
            var data = {};

            switch (field.id) {
                case 'top':
                case 'left':
                case 'height':
                case 'width':
                case 'resolution':
                    data[field.id] = parseInt(field.value);
                    break;

                case 'brightness':
                case 'contrast':
                    var val = parseInt(field.value);
                    var $slider = $("#" + field.id + "_slider");
                    val = isNaN(val) ? $slider.slider("value") : val;
                    if (val < -100) val = -100;
                    if (val > 100) val = 100;
                    field.value = val;
                    data[field.id] = val;
                    $slider.slider("value", val);
                    break;

                case 'dynamicLineart':
                    data[field.id] = field.value === 'true';
                    break;

                default:
                    data[field.id] = field.value;
                    break;
            }

            this.model.set(data);
            this.model.save();

            jcrop.draw();
        },

        // Called to take the preview image and return it as
        // a base64 encoded jpg and update the UI
        convert: function () {
            var request = {
                url: 'convert',
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(page.model.toJSON())
            };

            return $.ajax(request).then(function (fileInfo) {
                if (fileInfo.content) {
                    $("#image").attr('src', 'data:image/jpeg;base64,' + fileInfo.content);
                    $("#image").css('display', 'block');
                }
            });            
        },

        preview: function () {
            page.mask();

            // Keep reloading the preview image
            var timer = window.setInterval(this.convert, 500);

            var data = this.model.toJSON();
            data.device = page.device;

            var request = {
                url: 'preview',
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(data)
            };

            // Start the scan
            return $.ajax(request)
                .fail(page.fail)
                .always(function () {
                    window.clearInterval(timer);
                    page.unmask();
                });
        },

        scan: function () {
            var adf = prompt("Choose:\n 1 = Flatbed \n 2 = Odd pages \n 3 = Even pages \n 4 = Merge \n 5 = HP Scan Odd \n 6 = HP Scan Even \n 7 = HP Scan Merge","1");
            if (adf === null || adf === "") {
                return;   
            }
            page.mask();
            var data = this.model.toJSON();
            data.device = page.device;
            data.adf = adf;
            
            var request = {
                url: 'scan',
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(data)
            };

            return $.ajax(request)
                .fail(page.fail)
                .always(page.unmask)
                .done(function () {
                    page.files.fetch();
                });
        },

        initialize: function () {
            var html = this.template();
            this.$el.append(html);

            $(window).on('resize', function () {
                clearTimeout(page.resizeTimer);
                page.resizeTimer = setTimeout(function () {
                    jcrop.draw();
                    page.convert();
                }, 100);
            });

            $(".slider").slider({
                min: -100,
                max: 100,
                value: 0,
                step: 1,
                slide: function (e, ui) {
                    var $input = $("#" + e.target.id.replace("_slider", ""));
                    $input.val(ui.value).change();
                }
            });

            this.diagnostics = new Diagnostics();
            this.diagnostics.on("sync", this.diagnosticsSync, this);
            this.diagnostics.fetch();

            this.device = new Device();
            this.device.on("sync", this.deviceSync, this);
            this.device.fetch();

            this.model = new ScanRequest();
            this.model.on("sync", this.render, this);
            this.model.on("change", this.render, this);
            this.model.fetch();

            this.files = new FileCollection();
            this.listenTo(this.files, 'add', this.add);
            this.files.fetch();
        },

        diagnosticsSync: function (diagnostics) {
            _.each(diagnostics.attributes, function (test) {
                if (test.success === true) {
                    toastr.success(test.message);
                } else {
                    toastr.error(test.message);
                }
            });
        },

        deviceSync: function (device) {
            this.device = device;
            var modes = device.attributes.features['--mode'].options.split('|');
            $mode = $('#mode');
            _.each(modes, function (val) {
                $mode.append('<option>' + val + '</option>');
            });

            if (this.model.attributes.mode === null) {
                this.model.attributes.mode = device.attributes.features['--mode'].default;
            }

            $('#version').text(device.attributes.version);
            
            // We've changed the UI mode options so refresh
            this.render();
        },

        render: function (ev) {
            var attrs = (ev && ev.changed) || this.model.attributes;
            var device = this.device;
            _.each(attrs, function (val, id) {
                var $e = this.$('#' + id);
                if ($e) {
                    $e.val(val);
                }

                if (id === 'contrast' || id === 'brightness') {
                    $e = this.$('#' + id + '_slider');
                    $e.slider('value', val);
                } else if (id === 'mode' && device) {
                    // This might be called before fetching the device model, in which case
                    // `features` might be incorrect. This will self-correct once the device
                    // model is fetched.
                    var features = device.attributes.features;
                    var isDisableSupported = features && '--disable-dynamic-lineart' in features;
                    var visible = val === 'Lineart' && isDisableSupported;
                    $("#formGroupDynamicLineart").toggle(visible);
                } else if (id === 'dynamicLineart') {
                    $e.val(String(val));
                }
            });
        },

        add: function (file) {
            var view = new FileView({ model: file });
            var render = view.render();
            this.$("#files-table-body").append(render.el);
        }
    });

    var JcropManager = function (model) {
        var _this = this;
        
        _this.dotsToMm = function (dots) {
            var millimetresPerDot = _this.millimetresPerInch / _this.previewDpi;
            return Math.round(dots * millimetresPerDot);
        };

        _this.mmToDots = function (mm) {
            var dotsPerMm = _this.previewDpi / _this.millimetresPerInch;
            return Math.round(mm * dotsPerMm);
        };

        //jcrop onChange and onSelect event handler
        _this.showCoords = function (c) {
            _this.model.set({
                'left': _this.dotsToMm(c.x),
                'top': _this.dotsToMm(c.y),
                'width': _this.dotsToMm(c.w),
                'height': _this.dotsToMm(c.h)
            });

            _this.model.save();
        };

        //jcrop onRelease event handler
        _this.clearCoords = function () {
            _this.model.set({
                'left': 0,
                'top': 0,
                'width': _this.canvas.width,
                'height': _this.canvas.height
            });

            _this.model.save();
        };

        _this.getSelect = function () {
            var data = _this.model.toJSON();
            return [
                _this.mmToDots(data.left),
                _this.mmToDots(data.height + data.top),
                _this.mmToDots(data.width + data.left),
                _this.mmToDots(data.top)
            ];
        };

        _this.draw = function () {
            // Get page dimensions
            var width = $('#fields').width();
            var height = Math.round(width * _this.a4.height / _this.a4.width);
            var factor = _this.millimetresPerInch / _this.a4.width;

            $.extend(_this, {
                previewDpi: width * factor,
                canvas: {
                    width: width,
                    height: height
                }
            });

            // Existing image data
            var image = null;

            // Destroy any existing jcrop
            if (_this.jcrop_api) {
                image = $("#image").attr('src');
                _this.jcrop_api.destroy();
            }

            // Recreate the image container
            $('#previewPane').append('<div id="jcrop"><img id="image" style="display: none" /></div>');
            $('#jcrop, #image').css('width', _this.canvas.width);
            $('#jcrop, #image').css('height', _this.canvas.height);
            if (image) {
                $("#image").attr('src', image);
                $("#image").css('display', 'block');
            }

            $('#jcrop').Jcrop({
                onChange: _this.showCoords,
                onSelect: _this.showCoords,
                onRelease: _this.clearCoords,
                setSelect: _this.getSelect()
            }, function () {
                _this.jcrop_api = this;
            });
        };

        _this.init = function (model) {
            $.extend(_this, {
                millimetresPerInch: 25.4,
                a4: {
                    width: 215,
                    height: 297
                },
                jcrop_api: null,
                model: model
            });

            _this.draw();
        };

        _this.init(model);
    };

    // Run
    var page = new Page();
    page.convert();

    var jcrop = new JcropManager(page.model);
});


