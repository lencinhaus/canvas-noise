if(!window.console) console = {};
if(!console.log) console.log = function() {};

$(function() {
	// presets
	var defaultPresetArgs = {
		seed: 'noize',
		color: 'greyscale',
		noiseFunction: 'perlin_improved',
		smoothing: 'quintic',
		scale: 50,
		size: 256,
		octaves: 1,
		persistence: .5,
		lacunarity: 2,
		gradientStart: 'ff0000',
		gradientEnd: '00ff00',
		independent: false,
		octaveFunction: 'none',
		customOctaveFunction: 'return n;',
		sumFunction: 'none',
		customSumFunction: 'return n;',
		sineFrequencyCoeff: 1,
		modularAmplitude: 5
	};
	
	var presets = {
		plain: $.extend({}, defaultPresetArgs),
		clouds: $.extend({}, defaultPresetArgs, {
			octaves: 5
		}),
		turbulence: $.extend({}, defaultPresetArgs, {
			octaves: 5,
			octaveFunction: 'absolute'
		}),
		marble: $.extend({}, defaultPresetArgs, {
			octaves: 5,
			octaveFunction: 'absolute',
			sumFunction: 'sine'
		}),
		wood: $.extend({}, defaultPresetArgs, {
			sumFunction: 'modular'
		}),
	};

	// UI stuff
	var $controls = $('#controls');
	var $controlsContainer = $('#controls-container');
	
	// tooltips
	$controls.find('label').each(function() {
		var label = $(this);
		var tooltip = label.parent().find('.tooltip:first');
		if(!tooltip.length) return;
		label.tooltip({
			items: 'label',
			content: tooltip.html(),
			hide: {
				delay: 2000
			},
			position: {
				my: 'right top',
				at: 'left top'
			},
			open: function() {
				var tooltipId = $(this).data('ui-tooltip-id');
				$('.ui-tooltip:not(#' + tooltipId + ')').hide();
			}
		});
	});

	// buttons
	$('#refresh').button().click(startUpdate);
	$('#download').button().click(downloadImage);
	
	// dialogs
	$('#update-error').dialog({
		modal: true,
		resizable: false,
		draggable: false,
		autoOpen: false,
		buttons: [{
			text: "Ok", 
			click: function() { 
				$( this ).dialog( "close" ); 
			} 
		}],
		dialogClass: 'no-close'
	});
	
	// toggle
	$('#color').change(function() {
		$('#gradient-container').toggle($(this).val() == 'gradient');
	});
	$('#noiseFunction').change(function() {
		var noiseFunction = $(this).val();
		$('#smoothing-container').toggle(noiseFunction != 'simplex');
	});
	$('#octaveFunction').change(function() {
		$('#custom-octave-function-container').toggle($(this).val() == 'custom');
	});
	$('#sumFunction').change(function() {
		var sumFunction = $(this).val();
		$('#sine-container').toggle(sumFunction == 'sine');
		$('#modular-container').toggle(sumFunction == 'modular');
		$('#custom-sum-function-container').toggle(sumFunction == 'custom');
	});
	
	// presets
	$('#preset').change(function() {
		var presetArgs = presets[$(this).val()];
		setArgs(presetArgs);
		startUpdate();
		$(this).val('');
	});
	
	// progress
	$('#progress').progressbar({
		max: 100,
		value: 0,
		disabled: true
	});
	
	// sliders
	$('#scaleSlider').slider({
		min: 0,
		max: 100,
		slide: function(event, ui) {
			$('#scale').val(ui.value);
		}
	});
	$('#sizeSlider').slider({
		min: 2,
		max: 2048,
		slide: function(event, ui) {
			$('#size').val(ui.value);
		}
	});
	$('#octavesSlider').slider({
		min: 1,
		max: 10,
		slide: function(event, ui) {
			$('#octaves').val(ui.value);
		}
	});
	$('#persistenceSlider').slider({
		min: 0,
		max: 100,
		slide: function(event, ui) {
			$('#persistence').val(parseFloat(ui.value) / 100);
		}
	});
	$('#lacunaritySlider').slider({
		min: 1,
		max: 10,
		slide: function(event, ui) {
			$('#lacunarity').val(ui.value);
		}
	});
	$('#sineFrequencyCoeffSlider').slider({
		min: 1,
		max: 100,
		slide: function(event, ui) {
			$('#sineFrequencyCoeff').val(parseFloat(ui.value) / 20);
		}
	});
	$('#modularAmplitudeSlider').slider({
		min: 1,
		max: 100,
		slide: function(event, ui) {
			$('#modularAmplitude').val(parseFloat(ui.value) / 10);
		}
	});
	
	// colorpickers
	$('#gradientStart').colorpicker({
		altField: '#gradientStartColor',
		title: 'Gradient Start',
		open: function() {
			var colorpicker = $(this).data('vanderlee-colorpicker');
			colorpicker.dialog.position({
				my: 'right-10 top',
				at: 'left top',
				of: '#gradientStartColor'
			});
		}
	});
	$('#gradientStartColor').click(function() {
		if($('#gradientStart').attr('disabled') != 'disabled') $('#gradientStart').colorpicker('open');
	});
	$('#gradientEnd').colorpicker({
		altField: '#gradientEndColor',
		title: 'Gradient End',
		open: function() {
			var colorpicker = $(this).data('vanderlee-colorpicker');
			colorpicker.dialog.position({
				my: 'right-10 top',
				at: 'left top',
				of: '#gradientEndColor'
			});
		}
	});
	$('#gradientEndColor').click(function() {
		if($('#gradientEnd').attr('disabled') != 'disabled') $('#gradientEnd').colorpicker('open');
	});
	$('#independentCheckbox').change(function() {
		$('#independent').val(this.checked?true:false);
	});
	
	// canvas
	var canvas = document.getElementById('canvas');
	var context;
	
	// worker
	var noiseWorker = new Worker('js/noise.js');
	noiseWorker.addEventListener('message', function(e) {
	    switch(e.data.action) {
		    case 'updated': 
			context.putImageData(e.data.imageData, 0, 0);
			updateFinished(); 
			break;
		    case 'progress': 
			updateProgress(e.data.progress); 
			break;
		    case 'log': 
			console.log.apply(console, e.data.args); 
			break;
	    }
	}, false);
	noiseWorker.addEventListener('error', function(e) {
		console.log('noise error:', e);
		$('#update-error-message').text(e.message);
		$('#update-error').dialog('open');
		updateFinished(); 
	}, false);
	
	// arguments
	function setArgs(args) {
		for(var key in args) {
			var value = args[key];
			$('#' + key).val(value);
		}
		
		// sliders
		$('#scaleSlider').slider('value', args.scale);
		$('#sizeSlider').slider('value', args.size);
		$('#octavesSlider').slider('value', args.octaves);
		$('#persistenceSlider').slider('value', args.persistence * 100);
		$('#lacunaritySlider').slider('value', args.lacunarity);
		$('#sineFrequencyCoeffSlider').slider('value', args.sineFrequencyCoeff * 20);
		$('#modularAmplitudeSlider').slider('value', args.modularAmplitude * 10);
		
		// colors
		$('#gradientStartColor').css('backgroundColor', '#' + args.gradientStart);
		$('#gradientEndColor').css('backgroundColor', '#' + args.gradientEnd);
		
		// toggle
		$('#smoothing-container').toggle(args.noiseFunction != 'simplex');
		$('#gradient-container').toggle(args.color == 'gradient');
		$('#independentCheckbox').get(0).checked = args.independent;
		$('#custom-octave-function-container').toggle(args.octaveFunction == 'custom');
		$('#custom-sum-function-container').toggle(args.sumFunction == 'custom');
		$('#sine-container').toggle(args.sumFunction == 'sine');
		$('#modular-container').toggle(args.sumFunction == 'modular');
	}
	
	function collectArgs() {
		var args = {};
		$('.control input:not(.skip), .control select:not(.skip), .control textarea:not(.skip)', $controls).each(function() {
			var control = $(this);
			args[control.attr('id')] = control.val();
		});
		args.scale = parseFloat(args.scale);
		args.size = parseInt(args.size);
		args.octaves = parseInt(args.octaves);
		args.persistence = parseFloat(args.persistence);
		args.lacunarity = parseInt(args.lacunarity);
		args.sineFrequencyCoeff = parseFloat(args.sineFrequencyCoeff);
		args.modularAmplitude = parseFloat(args.modularAmplitude);
		args.independent = args.color != 'greyscale' && args.independent == 'true';
		return args;
	}
	
	// update
	function startUpdate() {
		// update the permalink
		updatePermalink();
		
		// disable/enable controls
		$('.control input, .control select, .control textarea', $controls).attr('disabled', 'disabled');
		$('button', $controls).button('disable');
		$('.control.slider > .slider', $controls).slider('disable');
		$('#progress').progressbar('enable');
		
		updateProgress(0);
		var args = collectArgs();
		var imageData = context.createImageData(canvas.width, canvas.height);
		noiseWorker.postMessage({ 
			action: 'update',
			imageData: imageData,
			args: args 
		});
	}
	
	function updateFinished(imageData) {
		updateProgress(0);
		
		// enable/disable controls
		$('#progress').progressbar('disable');
		$('.control input, .control select, .control textarea', $controls).removeAttr('disabled');
		$('button', $controls).button('enable');
		$('.control.slider > .slider', $controls).slider('enable');
	}
	
	var updatingProgress = false;
	function updateProgress(progress) {
		if(updatingProgress) return;
		updatingProgress = true;
		$('#progress').progressbar('value', progress);
		updatingProgress = false;
	}
	
	// download
	function downloadImage() {
		if(!canvas.toDataURL) {
			alert('cannot download: your browser doesn\'t support canvas.toDataURL');
			return;
		}
		document.location.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
	}
	
	// permalink
	function updatePermalink() {
		var args = collectArgs();
		var serialized = $.param(args);
		location.hash = '#' + serialized;
	}
	
	function resize() {
		$controlsContainer.height(window.innerHeight);
		canvas.width = window.innerWidth - $controlsContainer.outerWidth();
		canvas.height = window.innerHeight;
		context = canvas.getContext('2d');
	}
	
	$(window).resize(resize);
	
	// init
	var args = $.extend({}, presets.plain);
	if(location.hash) $.extend(args, $.deparam(location.hash.substr(1), true));
	
	setArgs(args);
	resize();
	startUpdate();
});