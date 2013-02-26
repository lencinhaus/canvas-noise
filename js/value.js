noiseFunctions['value'] = {
	values: null,
	init: function() {
		// generate the random values
		this.values = [];
		for(var i = 0; i < args.size; i++) {
			this.values[i] = this.values[i + args.size] = Math.random();
		}
	},
	noise: function(x, y) {
		var x0 = Math.floor(x) % args.size;
		var y0 = Math.floor(y) % args.size;
		var x1 = (x0 + 1) % args.size;
		var y1 = (y0 + 1) % args.size;
		var vx = x - Math.floor(x);
		var vy = y - Math.floor(y);
		var sx = smooth(vx);
		var sy = smooth(vy);
		var i = perm[x0];
		var j = perm[x1];
		//log(i,j);
		var p00 = perm[i + y0];
		var p10 = perm[j + y0];
		var p01 = perm[i + y1];
		var p11 = perm[j + y1];
		var i1 = interpolate(sx, this.values[p00], this.values[p10]);
		var i2 = interpolate(sx, this.values[p01], this.values[p11]);
		return interpolate(sy, i1, i2);
	}
};