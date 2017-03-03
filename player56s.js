/*!
 * Player 56s v0.5.0
 * Copyright 2015 by Ivan Dymkov (http://dymio.net)
                 and 56 STUFF (http://www.56stuff.com/)
 * Licensed under the MIT license
 * Inspired by Jouele 2.0.0
 *   https://github.com/ilyabirman/Jouele
 *   In fact, code of this plugin is reworked code of Jouele =)
 *   based on commit 49ec04bfeb14c5617ef06b91746bdc3a5e940660
 */

(function($) {

    "use strict";

    var isSVGSupported = false;
    var checkSVGSupport = function () {
        /* https://css-tricks.com/a-complete-guide-to-svg-fallbacks/ */
        var div = document.createElement("div");
        div.innerHTML = "<svg/>";
        return (div.firstChild && div.firstChild.namespaceURI) == "http://www.w3.org/2000/svg";
    };
    var setSVGSupport = function() {
        if ((typeof Modernizr === "object" && typeof Modernizr.inlinesvg === "boolean" && Modernizr.inlinesvg) || checkSVGSupport()) {
            isSVGSupported = true;
        }
        return this;
    };

    var splitFilenameToTrackAndAuthor = function(filename) {
        var delimeter = ' - ';
        if (filename.indexOf(' \u2014 ') > -1) { delimeter = ' \u2014 '; }
        return filename.toString().split(delimeter);
    }

    var getTrackTitle = function(filename) {
        var parts = splitFilenameToTrackAndAuthor(filename);
        return parts.length > 1 ? parts[1] : parts[0]
    }

    var getTrackAuthor = function(filename) {
        var parts = splitFilenameToTrackAndAuthor(filename);
        return parts.length > 1 ? ('by ' + parts[0]) : ""
    }

    var formatTime = function(rawSeconds) {
        if (typeof rawSeconds !== "number") {
            return rawSeconds;
        }

        var seconds = Math.round(rawSeconds) % 60,
            minutes = ((Math.round(rawSeconds) - seconds) % 3600) / 60,
            hours = (Math.round(rawSeconds) - seconds - (minutes * 60)) / 3600;

        return (hours ? (hours + ":") : "") + ((hours && (minutes < 10)) ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    };

    var makeSeconds = function(time) {
        if (typeof time === "number") {
            return time;
        }

        var array = time.split(":").reverse(),
            seconds = 0;

        for (var i = 0; i < array.length; i++) {
            seconds += array[i] * Math.pow(60, i);
        }

        return seconds;
    };

    var showPreloader = function(instance, timeout) {
        return instance; // we haven't the preloader
    };

    var hidePreloader = function(instance) {
        return instance; // we haven't the preloader
    };

    var updateLoadBar = function(instance, status) {
        if ((instance.fullyLoaded && instance.totalTime) || !instance.isPlayed) {
            return instance;
        }

        var roundedSeekPercent = Math.round(status.seekPercent); // because Safari sometimes shows 99.999999999

        if (roundedSeekPercent >= 100) {
            instance.fullyLoaded = true;
            instance.totalTime = status.duration;
        } else if (roundedSeekPercent > 0) {
            instance.totalTime = status.duration;
        } else {
            instance.totalTime = 0;
        }

        instance.$container.find(".player56s-timeline-load").css({"width": Math.floor(Math.min(100, roundedSeekPercent)) + "%"});

        return instance;
    };

    var updatePlayBar = function(instance, percents) {
        if (instance.seekTime && !instance.isSeeking) {
            return instance;
        }

        // instance.$container.find(".player56s-play-lift").css("left", percents  + "%");
        instance.$container.find(".player56s-timeline-done").css("width", percents + "%");

        return instance;
    };

    var updateTimeDisplay = function(instance, seconds) {
        if (instance.$container.find(".player56s-time").length < 1) {
            return instance;
        }

        if (instance.totalTime <= 0 && !instance.options.length) {
            return instance;
        }

        var totalSeconds = instance.totalTime || makeSeconds(instance.options.length);

        // we haven't total time info

        if ((instance.isPlaying || instance.waitForLoad) && (totalSeconds || instance.seekTime)) {
            instance.$container.find(".player56s-time").html(formatTime(totalSeconds - (instance.seekTime ? instance.seekTime : seconds)));
        }

        return instance;
    };

    var willSeekTo = function(instance, seekPercent) {
        var percent = seekPercent.toFixed(2);

        if (percent < 0) {
            percent = 0;
        } else if (percent > 100) {
            percent = 100;
        }

        updatePlayBar(instance, percent);
        showPreloader(instance);

        instance.waitForLoad = true;
        instance.$jPlayer.jPlayer("playHead", percent);
        instance.pseudoPlay();

        if (instance.fullTimeDisplayed) {
            instance.seekTime = (instance.totalTime / 100) * percent;
            updateTimeDisplay(instance, instance.seekTime);
        } else if (instance.options.length) {
            instance.seekTime = (makeSeconds(instance.options.length) / 100) * percent;
            updateTimeDisplay(instance, instance.seekTime);
        } else {
            instance.seekTime = 0.01;
        }

        return instance;
    };

    var checkAndRunTicker = function(instance) {
        var titleCont = instance.$container.find(".player56s-title");
        if (!titleCont.length) { return instance; }
        var innerSpan = titleCont.children("span");
        if (innerSpan.length && ((innerSpan.height() - 10) > titleCont.height())) {
            // we need to activate ticker for title
            innerSpan.css({ 'display': 'block', 'position' : 'relative' }).width(titleCont.width());
            while ((innerSpan.height() - 10) > titleCont.height()) {
                innerSpan.width( innerSpan.width() + 20 );
            }

            var treset = function() {
                if (!this) { return false; }
                var $this = $(this);
                var parCont = $this.parent();
                if (!parCont.length) { return false; }
                var diff = $this.width() - parCont.width();
                $this.animate({ "left": $this.css("left") }, 1000, function() {
                    $this.css("left", "0");
                    $this.animate({ "left": "0" }, 2000, function() {
                        $this.animate({
                            "left": "-" + diff + "px"
                        }, (diff * 40), 'linear', treset);
                    });
                });
            };

            treset.call(innerSpan[0]);
        }
        return instance;
    };

    $.fn.player56s = function(options) {
        var relGroups = [];
        return this.each(function() {
            var $this = $(this),
                thisClass = $this.attr("class"),
                thisRel = $this.attr("rel"),
                thisIsMinimal = (thisClass.indexOf("minimal") > -1),
                canHaveGroup = (!thisIsMinimal && thisRel),
                skinClassPosition = thisClass.indexOf("player56s-skin-"),
                player56sInstance = $this.data("player56s"),
                skin = "",
                goAndCreate = true;

            if (canHaveGroup) {
                for (var i = 0; i < relGroups.length; i++) {
                    if (relGroups[i].group == thisRel) {
                        var audiofileLink = $this.attr("href");
                        var filename = $this.html();
                        relGroups[i].pl56s.addTrack(audiofileLink, filename, $.extend({}, $this.data()));
                        $this.detach();
                        goAndCreate = false;
                        break;
                    }
                }
            }

            if (goAndCreate) {
                if (player56sInstance) {
                    /* Update current instance (soon) */
                } else {
                    /* Create new instance */
                    if (skinClassPosition > 0) {
                        skin = thisClass.substr(skinClassPosition + 12, thisClass.indexOf(" ", skinClassPosition) > 0 ? thisClass.indexOf(" ", skinClassPosition) : thisClass.length);
                    }
                    var pl56si = new Player56s($this, $.extend({}, $.fn.player56s.defaults, options, $this.data(), {skin: skin}));
                    if (canHaveGroup) {
                        relGroups.push({ group: thisRel, pl56s: pl56si });
                    }
                }
            }
        });
    };

    $.fn.player56s.defaults = {
        swfPath: "./vendor/",
        swfFilename: "jquery.jplayer.swf",
        supplied: "mp3",
        volume: 0.6,
        length: 0,
        scrollOnSpace: false,
        pauseOnSpace: true,
        hideTimelineOnPause: false,
        skin: ""
    };

    function Player56s($link, options) {
        this.version = "0.5.0";
        this.$link = $link;
        this.options = options;
        this.minimal = $link.hasClass('minimal');
        this.isPlaying = false;
        this.isPlayed = false;
        this.totalTime = 0;
        this.fullyLoaded = false;
        this.fullTimeDisplayed = false;
        this.waitForLoad = false;
        this.seekTime = 0;
        this.preloaderTimeout = null;
        this.isSeeking = false;
        this.tracks = [];
        this.currentTrack = 0;

        this.init();
    }

    Player56s.prototype.init = function init() {
        this.tracks.push({
            audiofileLink: this.$link.attr("href"),
            filename: this.$link.html(),
            length: this.options.length
        });
        this.checkOptions();
        this.createDOM();
        this.initPlayerPlugin();
        this.bindEvents();
        this.insertDOM();
    };

    Player56s.prototype.addTrack = function addTrack(audiofileLink, filename, trackOptions) {
        this.tracks.push({
            audiofileLink: audiofileLink,
            filename: filename,
            length: (trackOptions ? trackOptions.length : null)
        });
        this.$container.find(".player56s-track-next").addClass('enabled');
    };

    Player56s.prototype.destroy = function destroy() {
        var uniqueID = this.$container.attr("id");

        this.$container.after(this.$link).remove();
        $(document).off("." + uniqueID);

        this.$link.removeData("player56s");

        return this.$link;
    };

    Player56s.prototype.pause = function pause() {
        hidePreloader(this);

        if (!this.seekTime) {
            this.waitForLoad = false;
        }

        if (typeof this.$jPlayer !== "undefined" && this.$jPlayer.jPlayer) {
            if (this.isPlaying || this.waitForLoad) {
                this.isPlaying = false;
                this.waitForLoad = false;
                this.$jPlayer.jPlayer("pause");
            }
        }

        if (!this.isPlaying) {
            this.pseudoPause();
        }

        return this;
    };

    Player56s.prototype.pseudoPause = function pseudoPause() {
        this.$container.removeClass("player56s-status-playing");
    };

    Player56s.prototype.stop = function stop() {
        if (typeof this.$jPlayer !== "undefined" && this.$jPlayer.jPlayer) {
            if (this.isPlaying) {
                this.$jPlayer.jPlayer("stop");
            }
        }

        return this;
    };

    Player56s.prototype.play = function play() {
        showPreloader(this, this.seekTime ? false : 500); // 500 is enough to play the loaded fragment, if it's loaded; if isn't — preloader will appear after 500ms

        this.isPlayed = true;

        if (typeof this.$jPlayer !== "undefined" && this.$jPlayer.jPlayer) {
            if (!this.isPlaying) {
                this.$jPlayer.jPlayer("play");
            }
        }

        return this;
    };

    Player56s.prototype.pseudoPlay = function pseudoPlay() {
        $(document).trigger("player56s-pause", this);
        this.isPlayed = true;
        this.$container.addClass("player56s-status-playing");
    };

    Player56s.prototype.setVolume = function setVolume(lvl, maxLvl) {
        var changed = false;
        if (typeof this.$jPlayer !== "undefined" && this.$jPlayer.jPlayer) {
            lvl = lvl || 0;
            maxLvl = maxLvl || 1;
            if (lvl > maxLvl) { lvl = maxLvl; }
            this.$jPlayer.jPlayer("volume", lvl / maxLvl);
            changed = true;
        }
        return changed;
    };

    Player56s.prototype.switchTrack = function switchTrack(to_next) {
        if (to_next === undefined) { to_next = true; } // next by default
        if (typeof this.$jPlayer !== "undefined" && this.$jPlayer.jPlayer) {
            if (to_next && (this.currentTrack > this.tracks.length - 2)) {
                return false;
            }
            if (!to_next && this.currentTrack < 1) {
                return false;
            }

            this.pseudoPause();
            this.pause();
            this.stop();
            this.$jPlayer.jPlayer("clearMedia");
            this.currentTrack = this.currentTrack + (to_next ? 1 : -1);
            var track = this.tracks[this.currentTrack];
            this.$jPlayer.jPlayer("setMedia", {
                mp3: track.audiofileLink
            });
            this.$container.find(".player56s-title").html('<span>' + getTrackTitle(track.filename) + '</span>');
            this.$container.find(".player56s-author").html('<span>' + getTrackAuthor(track.filename) + '</span>');
            this.waitForLoad = true;
            this.pseudoPlay();
            this.play();

            this.$container.find(".player56s-track-prev").toggleClass('enabled', this.currentTrack > 0);
            this.$container.find(".player56s-track-next").toggleClass('enabled', this.currentTrack < (this.tracks.length - 1));
            checkAndRunTicker(this);
        }
    }

    Player56s.prototype.onPause = function onPause() {
        this.isPlaying = false;
        this.isSeeking = false;
        this.waitForLoad = false;
        this.$container.removeClass("player56s-status-playing");
    };

    Player56s.prototype.onStop = function onStop() {
        console.log("stop");
        this.isPlaying = false;
        this.seekTime = 0;
        this.isSeeking = false;
        this.waitForLoad = false;
        this.$container.removeClass("player56s-status-playing");
    };

    Player56s.prototype.onPlay = function onPlay() {
        $(document).trigger("player56s-pause", this);
        this.$container.addClass("player56s-status-playing");
        this.waitForLoad = false;
        this.isPlaying = true;
        this.isPlayed = true;
    };

    Player56s.prototype.checkOptions = function checkOptions() {
        if (!parseInt(this.options.length)) {
            this.options.length = 0;
        }
    };

    Player56s.prototype.createDOM = function createDOM() {
        var $container = $(document.createElement("div")),
            $invisibleObject = $(document.createElement("div")),
            $infoArea = $(document.createElement("div")),
            filename = this.tracks[0].filename,

            self = this;

        var createMinimanContentDOM = function() {
            return [
                $(document.createElement("div")).addClass("player56s-timeline").append(
                    $(document.createElement("div")).addClass("player56s-timeline-load"),
                    $(document.createElement("div")).addClass("player56s-timeline-done")
                ),
                $(document.createElement("div")).addClass("player56s-button"),
                $(document.createElement("div")).addClass("player56s-volume").append(
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active").addClass("zero-vol"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("max-vol")
                ),
                $(document.createElement("div")).addClass("player56s-time").html(self.options.length ? formatTime(makeSeconds(self.options.length)) : "")
            ];
        };

        var createNormalContentDOM = function() {
            return [
                $(document.createElement("div")).addClass("player56s-title").html('<span>' + getTrackTitle(filename) + '</span>'),
                $(document.createElement("div")).addClass("player56s-author").html('<span>' + getTrackAuthor(filename) + '</span>'),
                $(document.createElement("div")).addClass("player56s-timeline").append(
                    $(document.createElement("div")).addClass("player56s-timeline-load"),
                    $(document.createElement("div")).addClass("player56s-timeline-done")
                ),
                $(document.createElement("div")).addClass("player56s-button"),
                $(document.createElement("div")).addClass("player56s-volume").append(
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("max-vol"),
                    $(document.createElement("div")).addClass("player56s-vol-pin"),
                    $(document.createElement("div")).addClass("player56s-vol-pin"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active"),
                    $(document.createElement("div")).addClass("player56s-vol-pin").addClass("active").addClass("zero-vol")
                ),
                $(document.createElement("div")).addClass("player56s-tracks").append(
                    $(document.createElement("div")).addClass("player56s-track-nav").addClass("player56s-track-prev"),
                    $(document.createElement("div")).addClass("player56s-track-nav").addClass("player56s-track-next")
                )
            ];
        };

        var createContentAreaDOM = function() {
            return (self.minimal ? createMinimanContentDOM() : createNormalContentDOM());
        }

        this.$container = $container
            .data("player56s", this)
            .addClass("player56s")
            .addClass(self.minimal ? "minimal" : "normal")
            .attr("id", "player56s-ui-zone-" + (1000 + Math.round(Math.random() * 8999)))
            .append(
                $invisibleObject.addClass("player56s-invisible-object"),
                $infoArea.addClass("player56s-content").append(createContentAreaDOM())
            );

        return this;
    };

    Player56s.prototype.initPlayerPlugin = function initPlayerPlugin() {
        var self = this,
            $jPlayer = self.$container.find(".player56s-invisible-object");

        this.$jPlayer = $jPlayer.jPlayer({
            solution: "html",
            wmode: "window",
            preload: "metadata",

            swfPath: self.options.swfPath + self.options.swfFilename,
            supplied: self.options.supplied,
            volume: self.options.volume,

            ready: function() {
                var audiofileLink = self.tracks[0].audiofileLink,
                    uniqueID = self.$container.attr("id");

                $jPlayer.jPlayer("setMedia", {
                    mp3: audiofileLink
                });

                self.$container.find(".player56s-button").on("click", function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (self.isPlaying) {
                        self.pseudoPause.call(self);
                        self.pause.call(self);
                    }
                    else {
                        self.waitForLoad = true;
                        self.pseudoPlay.call(self);
                        self.play.call(self);
                    }
                });

                self.$container.find(".player56s-volume .player56s-vol-pin").on("click", function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    var $pin = $(this);
                    var $pinsBefore = self.minimal ? $pin.prevAll() : $pin.nextAll();
                    var lvl = $pinsBefore.length;
                    var maxLvl = $pin.siblings().length;
                    if (self.setVolume.call(self, lvl, maxLvl)) {
                        $pinsBefore.addClass('active');
                        $pin.addClass('active');
                        var $pinsAfter = self.minimal ? $pin.nextAll() : $pin.prevAll();
                        $pinsAfter.removeClass('active');
                    }
                });

                self.$container.find(".player56s-track-nav").on("click", function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    self.switchTrack.call(self, $(this).hasClass('player56s-track-next'));
                });

                self.$container.find(".player56s-timeline").on("mousedown." + uniqueID, function(event) {
                    if (event.which !== 1) {
                        return false;
                    }

                    event.stopPropagation();
                    event.preventDefault();

                    self.isSeeking = true;

                    var $this = $(this),
                        clickPoint = ((event.pageX - $this.offset().left) / $this.width()) * 100;

                    $(document).off("mouseup." + uniqueID).one("mouseup." + uniqueID, function() {
                        self.isSeeking = false;
                        showPreloader(self);
                    });
                    $(document).off("mousemove." + uniqueID).on("mousemove." + uniqueID, function(event) {
                        event.stopPropagation();
                        event.preventDefault();

                        if (!self.isSeeking) {
                            return false;
                        }

                        var clickPoint = ((event.pageX - $this.offset().left) / $this.width()) * 100;

                        willSeekTo(self, clickPoint);
                    });

                    willSeekTo(self, clickPoint);
                });
            },
            pause: function() {
                self.onPause.call(self);
            },
            stop: function() {
                self.onStop.call(self);
            },
            ended: function() {
                self.switchTrack.call(self);
            },
            play: function() {
                self.onPlay.call(self);
            },
            progress: function(event) {
                updateLoadBar(self, event.jPlayer.status);
                updateTimeDisplay(self, event.jPlayer.status.currentTime);
            },
            timeupdate: function(event) {
                updateLoadBar(self, event.jPlayer.status);
                updateTimeDisplay(self, event.jPlayer.status.currentTime);
                updatePlayBar(self, event.jPlayer.status.currentPercentAbsolute.toFixed(2));

                hidePreloader(self);

                if (self.waitForLoad) {
                    self.waitForLoad = false;
                    self.seekTime = 0;
                    self.play();
                    hidePreloader(self);
                }
            }
        });

        // Remove volume changer and add special class if have
        //   no ability to change a volume
        if (this.$jPlayer.data('jPlayer').status.noVolume) {
            self.$container.addClass("volumeless");
            self.$container.find(".player56s-volume").remove();
            this.setVolume(1, 1); // set maximum volume
        }

        return this;
    };

    Player56s.prototype.insertDOM = function insertDOM() {
        this.$link.after(this.$container);
        this.$link.data("player56s", this);
        this.$link.detach();
        checkAndRunTicker(this);

        return this;
    };

    Player56s.prototype.bindEvents = function bindEvents() {
        var self = this,
            uniqueID = self.$container.attr("id");

        $(document).on("player56s-pause." + uniqueID, function(event, triggeredPlayer56s) {
            if (self !== triggeredPlayer56s) {
                self.pause();
            }
        });

        $(document).on("keydown." + uniqueID, function(event) {
            if (event.keyCode === 32) {
                if (self.isPlaying && self.options.pauseOnSpace) {
                    self.$jPlayer.jPlayer("pause");
                }
            }
        });

        return this;
    };

    /* It's time to know if SVG supported */
    setSVGSupport();

    /* Autoload Player56s */
    var autoLoadPlayer56s = function() {
        $(".player56s").player56s();
    };
    $(autoLoadPlayer56s);

}(jQuery));
