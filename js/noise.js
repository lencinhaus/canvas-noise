/*
references:
- http://www.noisemachine.com/talk1
- http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
- http://webstaff.itn.liu.se/~stegu/TNM022-2005/perlinnoiselinks/perlin-noise-math-faq.html
- http://scratchapixel.com/lessons/3d-advanced-lessons/noise-part-1
- http://mrl.nyu.edu/~perlin/doc/oscar.html#noise
- http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
- http://staffwww.itn.liu.se/~stegu/simplexnoise/SimplexNoise.java
*/

var VERSION = '0.1';

// import required libs
importScripts('seedrandom.min.js', 'common.js?v=' + VERSION);

// shared functions and data
var imageData, args;

function log() {
	var args = [];
	for(var i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}
	postMessage({ action: 'log', args: args });
}

// import noise functions
var noiseFunctions = {};
importScripts('value.js?v=' + VERSION, 'perlin.js?v=' + VERSION, 'simplex.js?v=' + VERSION);

function update(data) {
	imageData = data.imageData;
	args = data.args;
	
	log('starting update:', args);
	
	// seed random
	Math.seedrandom(args.seed);
	
	// set the smoothing function
	smooth = smoothingFunctions[args.smoothing];
	
	// set noise processing functions
	if(args.octaveFunction == 'none') octaveFunction = null;
	else if(args.octaveFunction == 'custom') eval('octaveFunction = function(n, x, y) {' + args.customOctaveFunction + '}');
	else octaveFunction = octaveFunctions[args.octaveFunction];
	
	if(args.sumFunction == 'none') sumFunction = null;
	else if(args.sumFunction == 'custom') eval('sumFunction = function(n, x, y) {' + args.customSumFunction + '}');
	else sumFunction = sumFunctions[args.sumFunction];
	
	// set gradient components
	var gradientStartComponents = rgbHexToComponents(args.gradientStart);
	var gradientEndComponents = rgbHexToComponents(args.gradientEnd);
	
	// get and init the noise function
	var nf = noiseFunctions[args.noiseFunction];
	
	// init data and functions
	var doneSteps = 0;
	var oldProgress, progress = 0;
	var relativeScale = Math.pow(imageData.width, -args.scale / 100);
	
	function stepDone() {
		// publish progress
		doneSteps++;
		oldProgress = progress;
		progress = Math.round(doneSteps * 100 / totalSteps);
		if(progress != oldProgress) postMessage({
			action: 'progress',
			progress: progress
		});
	}
	
	// set color groups
	var colorGroups;
	if(args.color == 'greyscale' || (args.color == 'gradient' && !args.independent)) colorGroups = [[0,1,2]];
	else colorGroups = [[0],[1],[2]];
	
	// calculate total steps
	var totalSteps = imageData.width * imageData.height * colorGroups.length * args.octaves;
	if(args.color == 'hsl' || args.color == 'hsv') totalSteps += imageData.width * imageData.height;
	
	// set alphas
	for(var y = 0; y < imageData.height; y++) {
		for(var x = 0; x < imageData.width; x++) {
			var pixelIndex = (y * imageData.width * 4) + x * 4;
			imageData.data[pixelIndex + 3] = 255;
		}
	}
	
	// calculate noise values
	var values = [];
	var min = Number.MAX_VALUE;
	var max = Number.MIN_VALUE;
	for(var i = 0; i < colorGroups.length; i++) {
		// generate the permutations
		generatePermutationTable();
		
		// init the noise function
		nf.init();
		for(var y = 0; y < imageData.height; y++) {
			if(i == 0) values[y] = [];
			
			for(var x = 0; x < imageData.width; x++) {
				if(i == 0) values[y][x] = [];
				
				var scaledX = parseFloat(x) * relativeScale;
				var scaledY = parseFloat(y) * relativeScale;
				
				var noise = 0;
				var amplitude = 1, frequency = 1;
				
				for(var o = 0; o < args.octaves; o++) {
					var octave = nf.noise(scaledX * frequency, scaledY * frequency);
					if(octaveFunction) octave = octaveFunction(octave, scaledX, scaledY, o + 1);
					octave *= amplitude;
					noise += octave;
					
					// publish progress
					stepDone();
					
					// update amplitude and frequency
					frequency *= args.lacunarity;
					amplitude *= args.persistence;
				}
				
				values[y][x][i] = noise;
				min = Math.min(min, noise);
				max = Math.max(max, noise);
			}
		}
	}
	
	var noiseSpan = max - min;
	for(var y = 0; y < imageData.height; y++) {
		for(var x = 0; x < imageData.width; x++) {
			var scaledX = parseFloat(x) * relativeScale;
			var scaledY = parseFloat(y) * relativeScale;
			
			// scale noise values
			for(var i = 0; i < colorGroups.length; i++) {
				values[y][x][i] = (values[y][x][i] - min) / noiseSpan;
				
				// apply sum function
				if(sumFunction) values[y][x][i] = sumFunction(values[y][x][i], scaledX, scaledY);
			}
			
			// perform color conversion
			if(args.color == 'hsl' || args.color == 'hsv') {
				values[y][x] = ((args.color == 'hsl')?hslToRgb:hsvToRgb)(values[y][x]);
				
				// publish progress
				stepDone();
			}
			
			var pixelIndex = (y * imageData.width * 4) + x * 4;
			
			for(var i = 0; i < colorGroups.length; i++) {
				var color;
				
				if(args.color != 'gradient') {
					color = Math.round(values[y][x][i] * 255);
				}
				
				for(var j = 0; j < colorGroups[i].length; j++) {
					if(args.color == 'gradient') {
						var start = gradientStartComponents[colorGroups[i][j]];
						var end = gradientEndComponents[colorGroups[i][j]];
						color = Math.round(start + (values[y][x][i] * (end - start)));
					}
					imageData.data[pixelIndex + colorGroups[i][j]] = color;
				}
			}
		}
	}
	
	// clear up data
	values = null;
	
	log('update finished');
	postMessage({ action: 'updated', imageData: imageData });
}

addEventListener('message', function(e) {
	var data = e.data;
	switch(data.action) {
		case 'update': 
			update(data); 
			break;
	} 
}, false);