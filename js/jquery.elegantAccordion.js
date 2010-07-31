/*
	Elegant Accordion v1.0
	
	Originally by Mary Lou: http://tympanus.net/codrops/2010/04/26/elegant-accordion-with-jquery-and-css3/
	Plugin by Dean Sofer: http://www.deansofer.com/
*/

(function($) {
	
	__eAccordionRunTimes = 0; 
	
	$.eAccordion = function(el, options) {
		
		// To avoid scope issues, use 'base' instead of 'this'
		// to reference this class from internal events and functions.
		var base = this;
	  
    	// Keeps track of the index of the current instance
		__eAccordionrRunTimes++;
		base.runTimes = __eAccordionRunTimes;
			
		// Wraps the ul in the necessary divs and then gives Access to jQuery element
		base.$el = $(el);
		
		// Set up a few defaults
		base.currentPage = 1;
		base.timer = null;
		base.playing = false;
	
		// Add a reverse reference to the DOM object
		base.$el.data("ElegantAccordion", base);
		  
		base.init = function() {
		 			
			base.options = $.extend({},$.eAccordion.defaults, options);
				
			// Cache existing DOM elements for later 
			base.$wrapper = base.$el.find('> div');
			base.$slider  = base.$wrapper.find('> ul');
			base.$items   = base.$slider.find('> li');
			base.$single  = base.$items.filter(':first');
			
			// Set the dimensions
			if (base.options.width) {
				base.$el.css('width', base.options.width);
				base.$wrapper.css('width', base.options.width);
				base.$items.css('width', base.options.width);
			}
			if (base.options.height) {
				base.$el.css('height', base.options.height);
				base.$wrapper.css('height', base.options.height);
				base.$items.css('height', base.options.height);
			}
	
			// Get the details
			base.singleWidth = base.$single.outerWidth();
			base.pages = base.$items.length;
			
			// If autoPlay functionality is included, then initialize the settings
			if (base.options.autoPlay) {
				base.playing = !base.options.startStopped; // Sets the playing variable to false if startStopped is true
				base.buildAutoPlay();
			};
			
			// If pauseOnHover then add hover effects
			if (base.options.pauseOnHover) {
				base.$el.hover(function() {
					base.clearTimer();
				}, function() {
					base.startStop(base.playing);
				});
			}
			
			// If a hash can not be used to trigger the plugin, then go to page 1
			if ((base.options.hashTags == true && !base.gotoHash()) || base.options.hashTags == false) {
				base.setCurrentPage(1);
			};
			
			// Install the accordion effect
			if (base.$el.attr('rel')) {
				dimensions = base.$el.attr('rel').match(/\d+/g);
				width = dimensions[0];
				height = dimensions[1];
				$('> li', base.$el).height(height);
			}
			$('> li', base.$el).prepend('<div class="bgGradient"/>').hover(
		        function () {
		        	base.startStop(false);
		            base.$el.stop().animate({'width':'480px'},500).siblings().stop().animate({'width':'100px'},500);
		            $('h2', base.$el).stop(true,true).fadeOut();
		            $('> div:not(.bgGradient)', base.$el).stop(true,true).fadeIn();
		            $('.bgGradient', base.$el).stop(true,true).animate({bottom:0},500);
		        }, null
		    );
		}
	
		base.gotoPage = function(page, autoplay) {
			// When autoplay isn't passed, we stop the timer
			if (autoplay !== true) autoplay = false;
			if (!autoplay) base.startStop(false);
			
			if (typeof(page) == "undefined" || page == null) {
				page = 1;
				base.setCurrentPage(1);
			};
			
			// Stop the slider when we reach the last page, if the option stopAtEnd is set to true
			if(base.options.stopAtEnd){
				if(page == base.pages) base.startStop(false);
			}
			
			// Just check for bounds
			if (page > base.pages + 1) page = base.pages;
			if (page < 0 ) page = 1;
	
			var dir = page < base.currentPage ? -1 : 1,
				n = Math.abs(base.currentPage - page),
				left = base.singleWidth * dir * n;
			
			base.$wrapper.filter(':not(:animated)').animate({
				scrollLeft : '+=' + left
			}, base.options.animationTime, base.options.easing, function () {
				if (page == 0) {
					base.$wrapper.scrollLeft(base.singleWidth * base.pages);
					page = base.pages;
				} else if (page > base.pages) {
					base.$wrapper.scrollLeft(base.singleWidth);
					// reset back to start position
					page = 1;
				}
	  
				base.setCurrentPage(page);
			});
		};
			
		base.setCurrentPage = function(page, move) {
			// Set visual
			if (base.options.buildNavigation){
				base.$nav.find('.cur').removeClass('cur');
				$(base.$navLinks[page - 1]).addClass('cur');
			};
			
			// Only change left if move does not equal false
			if (move !== false) base.$wrapper.scrollLeft(base.singleWidth * page);
	
			// Update local variable
			base.currentPage = page;
		};
			
		// This method tries to find a hash that matches panel-X
		// If found, it tries to find a matching item
		// If that is found as well, then that item starts visible
		base.gotoHash = function(){
			var hash = window.location.hash.match(/^#?panel(\d+)-(\d+)$/);
			if (hash) {
				var panel = parseInt(hash[1]);
				if (panel == base.runTimes) {
					var slide = parseInt(hash[2]);
					var $item = base.$items.filter(':eq(' + slide + ')');
					if ($item.length != 0) {
						base.setCurrentPage(slide);
						return true;
					}
				}
			}
			return false; // A item wasn't found;
		};
		
		// Handles stopping and playing the slideshow
		// Pass startStop(false) to stop and startStop(true) to play
		base.startStop = function(playing) {
			if (playing !== true) playing = false; // Default if not supplied is false
			
			// Update variable
			base.playing = playing;
			
			// Toggle playing and text
			if (base.options.autoPlay) base.$startStop.toggleClass("playing", playing).html( playing ? base.options.stopText : base.options.startText );
			
			if (playing){
				base.clearTimer(); // Just in case this was triggered twice in a row
				base.timer = window.setInterval(function() {
					base.goForward(true);
				}, base.options.delay);
			} else {
				base.clearTimer();
			};
		};
		
		base.clearTimer = function(){
			// Clear the timer only if it is set
			if(base.timer) window.clearInterval(base.timer);
		};
		
		// Taken from AJAXY jquery.history Plugin
		base.setHash = function (hash) {
			// Write hash
			if ( typeof window.location.hash !== 'undefined' ) {
				if ( window.location.hash !== hash ) {
					window.location.hash = hash;
				};
			} else if ( location.hash !== hash ) {
				location.hash = hash;
			};
			
			// Done
			return hash;
		};
		// <-- End AJAXY code

		// Trigger the initialization
		base.init();
	};

	$.eAccordion.defaults = {
		autoPlay: true,                 // This turns off the entire FUNCTIONALY, not just if it starts running or not
		startStopped: false,            // If autoPlay is on, this can force it to start stopped
		delay: 3000,                    // How long between slide transitions in AutoPlay mode
		animationTime: 600,             // How long the slide transition takes
		hashTags: true,                 // Should links change the hashtag in the URL?
		pauseOnHover: true,             // If true, and autoPlay is enabled, the show will pause on hover
		width: null,					// Override the default CSS width
		height: null,					// Override the default CSS height
	};
	
	$.fn.eAccordion = function(options) {
	  
		if (typeof(options) == "object"){
			return this.each(function(i){			
				(new $.eAccordion(this, options));
			});	
		
		} else if (typeof(options) == "number") {

			return this.each(function(i) {
				var eSlide = $(this).data('ElegantAccordion');
				if (eSlide) {
					eSlide.gotoPage(options);
				}
			});
			
		}
		
  };
	
})(jQuery);