/*
	Elegant Accordion v1.0
	
	Originally by Mary Lou: http://tympanus.net/codrops/2010/04/26/elegant-accordion-with-jquery-and-css3/
	Plugin by Dean Sofer: http://www.deansofer.com/
*/

(function($) {
	
	var __eAccordionRunTimes = 0; 
	
	$.eAccordion = function(el, options) {
		
		// To avoid scope issues, use 'base' instead of 'this'
		// to reference this class from internal events and functions.
		var base = this;
	  
		// Keeps track of the index of the current instance
		__eAccordionRunTimes++;
		base.runTimes = __eAccordionRunTimes;
			
		// Gives Access to jQuery element
		base.$el = $(el);
		
		// Set up a few defaults
		base.currentPage = 1;
		base.timer = null;
		base.playing = false;
	
		// Add a reverse reference to the DOM object
		base.$el.data("ElegantAccordion", base);
		  
		base.init = function() {
					
			base.options = $.extend({}, $.eAccordion.defaults, options);
				
			// Cache existing DOM elements for later
			base.$items   = base.$el.children('li');
			base.$single  = base.$items.last();
			
			// Fix jittering during animation
			base.$single.css('margin-right', '-20px');
			
			// Set the dimensions
			if (base.options.height) {
				base.$items.css('height', base.options.height);
			}
	
			// Get the details
			base.pages = base.$items.length;
			var expandedWidth;
			if (base.options.expandedWidth.indexOf("%") > -1) { // If a percent is given
				expandedWidth = base.$el.width() * (parseInt(base.options.expandedWidth) / 100);
			} else { // Otherwise use pixels
				expandedWidth = parseInt(base.options.expandedWidth);
			}
			base.contractedWidth = (base.$el.width() - expandedWidth) / (base.pages - 1);
			
			// If autoPlay functionality is included, then initialize the settings
			if (base.options.autoPlay) {
				base.playing = !base.options.startStopped; // Sets the playing variable to false if startStopped is true
				base.startStop(base.playing);
			};
			
			// If pauseOnHover then add hover effects
			if (base.options.pauseOnHover && base.options.autoPlay) {
				base.$el.hover(function() {
					base.clearTimer();
				}, function() {
					base.startStop(base.playing);
				});
			}
			
			// Add background images if set
			base.$items.filter('[data-bg]').each(function() {
				var $li = $(this);
				$li.css('backgroundImage', 'url(' + $li.data('bg') + ')' ); 
			});
			
			// Add formatting
			base.$items.hover(function () {
				base.startStop(false);
				base.gotoPage(base.$items.index(this) + 1);
			},function(){
				if (!base.clickStopped) {
					if (base.options.autoPlay) {
						base.startStop(true);
					} else if (base.options.neutralState) {
						base.gotoNeutral();
					}
				}
			}).click(function () {
				base.startStop(false);
				// Prevents the hover-out from re-enabling
				base.clickStopped = true;
			}).children('div').width(expandedWidth);
			
			// If a hash can not be used to trigger the plugin, then go to page 1
			if ((base.options.hashTags == true && !base.gotoHash()) || base.options.hashTags == false) {
				base.gotoPage(1, false);
			};
			
			// Enable neutral state
			if (base.options.neutralState) {
				base.neutralWidth = (100 / base.pages) + '%';
				base.gotoNeutral(false);
			}
		}
			
		base.gotoPage = function(page, animate) {
			if (typeof(page) == "undefined" || page == null) {
				page = 1;
			};
			
			// Stop the slider when we reach the last page, if the option stopAtEnd is set to true
			if(base.options.stopAtEnd){
				if(page == base.pages) base.startStop(false);
			}
			
			
			// Just check for bounds
			if (page > base.pages) page = 1;
			if (page < 1) page = 1;
			
			// Store the page to be shown
			var $page = base.$items.eq(page - 1);
			
			duration = (animate !== false) ? base.options.animationTime : 0;
			
			$page.stop(true, true).animate(
				{'width':base.options.expandedWidth},
				duration,
				base.options.easing
			);
			$page.children('h2').stop(true, true).animate({opacity: 0}, duration);
			$page.children('div').stop(true, true).animate({
				opacity: 1,
				marginBottom: 0,
				paddingBottom: 0
			}, duration);
			$siblings = $page.siblings();
			$siblings.stop(true, true).animate(
				{'width':base.contractedWidth},
				duration,
				base.options.easing
			);
			$siblings.children('h2').stop(true, true).animate({opacity: .9}, duration);
			$siblings.children('div').stop(true, true).animate({
				opacity: 0,
				marginBottom: '-' + base.options.bgHeight,
				paddingBottom: base.options.bgHeight
			}, duration);
			
			// Update local variable
			base.currentPage = page;
		};
		
		base.gotoNeutral = function(animate){
			duration = (animate !== false) ? base.options.animationTime : 0;
			base.$items.stop(true, true).animate(
				{'width':base.neutralWidth},
				duration,
				base.options.easing
			);
			base.$items.children('h2').stop(true, true).animate({opacity: .9}, duration);
			base.$items.children('div').stop(true, true).animate({
				opacity: 0,
				marginBottom: '-' + base.options.bgHeight,
				paddingBottom: base.options.bgHeight
			}, duration);
		};
			
		base.goForward = function() {
			base.gotoPage(base.currentPage + 1);
		};

		base.goBack = function() {
			base.gotoPage(base.currentPage - 1);
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
						base.gotoPage(slide, false);
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
			
			if (playing){
				base.clearTimer(); // Just in case this was triggered twice in a row
				base.timer = window.setInterval(function() {
					base.goForward();
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
		easing: 'swing',                // Anything other than "linear" or "swing" requires the easing plugin
		autoPlay: true,                 // This turns off the entire FUNCTIONALY, not just if it starts running or not
		startStopped: false,            // If autoPlay is on, this can force it to start stopped
		stopAtEnd: false,				// If autoplay is on, it will stop when it reaches the last slide
		delay: 4000,                    // How long between slide transitions in AutoPlay mode
		animationTime: 100,             // How long the slide transition takes
		hashTags: true,                 // Should links change the hashtag in the URL?
		pauseOnHover: true,             // If true, and autoPlay is enabled, the show will pause on hover
		height: null,					// Override the default CSS height
		expandedWidth: '60%',			// Width of the expanded slide
		neutralState: false,			// If there should be a state when all pages are equal size (usually onMouseOut)
		bgHeight: '340px'				// The height of the gradient image (bgDescription.png). Useful if you're modifying the image
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
			
		} else {
			return this.each(function(i) {
				var eSlide = $(this).data('ElegantAccordion');
				if (eSlide) {
					eSlide.gotoNeutral();
				}
			});
		}
		
  };
	
})(jQuery);