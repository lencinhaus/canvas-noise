// randomness
var perm;
var permMod8;

function generatePermutationTable() {
	perm = [];
	permMod8 = [];

	// init permutations
	var i, j, k;
	for(i = 0; i < args.size; i++) {
		perm[i] = i;
	}
	
	// shuffle them
	while (--i) {
		j = Math.floor(Math.random() * args.size);
		k = perm[i];
		perm[i] = perm[j];
		perm[j] = k;
	}
	
	// copy and mod them
	for(i = 0; i < args.size; i++) {
		perm[i + args.size] = perm[i];
		permMod8[i] = permMod8[i + args.size] = perm[i] % 8;
	}
}

// color conversion
function hslToRgb(values){
	var h = values[0], s = values[1], l = values[2];
	var r, g, b;

	if(s == 0){
		r = g = b = l; // achromatic
	}
	else {
		function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [r, g, b];
}

function hsvToRgb(values){
	var h = values[0], s = values[1], v = values[2];
	var r, g, b;

	var i = Math.floor(h * 6);
	var f = h * 6 - i;
	var p = v * (1 - s);
	var q = v * (1 - f * s);
	var t = v * (1 - (1 - f) * s);

	switch(i % 6){
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}

	return [r, g, b];
}

function rgbHexToComponents(rgb) {
	var r = parseInt(rgb.substr(0, 2), 16);
	var g = parseInt(rgb.substr(2, 2), 16);
	var b = parseInt(rgb.substr(4, 2), 16);
	return [r, g, b];
}

// noise processing
var octaveFunctions = {
	absolute: function(octave) {
		return Math.abs((octave * 2) - 1);
	}
};

var octaveFunction;

var sumFunctions = {
	sine: function(sum, scaledX) {
		return .5 + (Math.sin(scaledX * args.sineFrequencyCoeff + sum) / 2);
	},
	modular: function(sum) {
		var g = sum * args.modularAmplitude;
		return g - Math.floor(g);
	}
};

var sumFunction;

// smoothing
var smoothingFunctions = {
	none: function(t) {
		return t;
	},
	cosine: function(t) {
		return .5 * (1 + Math.cos((1 - t) * Math.PI))
	},
	hermite: function(t) {
		return t * t * (-t * 2 + 3);
	},
	quintic: function(t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}
};

var smooth;

function interpolate(t, a, b) {
	return a + t * (b - a);
}