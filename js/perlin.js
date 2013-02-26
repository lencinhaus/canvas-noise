noiseFunctions['perlin_classic'] = {
	grad: null,
	init: function() {
		var dist;
		
		// generate the gradients
		this.grad = [];
		for(var i = 0; i < args.size; i++) {
			this.grad[i] = [(Math.random() * 2) - 1, (Math.random() * 2) - 1];
			dist = Math.sqrt(this.grad[i][0] *  this.grad[i][0] + this.grad[i][1] * this.grad[i][1]);
			this.grad[i][0] /= dist;
			this.grad[i][1] /= dist;
		}
	},
	noise: function(x, y) {
		var bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
		bx0 = Math.floor(x) % args.size;
		bx1 = (bx0 + 1) % args.size;
		rx0 = x - Math.floor(x);
		rx1 = rx0 - 1;
		by0 = Math.floor(y) % args.size;
		by1 = (by0 + 1) % args.size;
		ry0 = y - Math.floor(y);
		ry1 = ry0 - 1;
		i = perm[bx0];
		j = perm[bx1];
		b00 = perm[i + by0];
		b10 = perm[j + by0];
		b01 = perm[i + by1];
		b11 = perm[j + by1];
		
		sx = smooth(rx0);
		sy = smooth(ry0);
		
		u = rx0 * this.grad[b00][0] + ry0 * this.grad[b00][1];
		v = rx1 * this.grad[b10][0] + ry0 * this.grad[b10][1];
		a = interpolate(sx, u, v);
		
		u = rx0 * this.grad[b01][0] + ry1 * this.grad[b01][1];
		v = rx1 * this.grad[b11][0] + ry1 * this.grad[b11][1];
		b = interpolate(sx, u, v);
		
		return .5 * (1 + interpolate(sy, a, b));
	}
};

noiseFunctions['perlin_improved'] = {
	grad: [
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	],
	init: function() {},
	noise: function(x, y) {
		var bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
		bx0 = Math.floor(x) % args.size;
		bx1 = (bx0 + 1) % args.size;
		rx0 = x - Math.floor(x);
		rx1 = rx0 - 1;
		by0 = Math.floor(y) % args.size;
		by1 = (by0 + 1) % args.size;
		ry0 = y - Math.floor(y);
		ry1 = ry0 - 1;
		i = perm[bx0];
		j = perm[bx1];
		b00 = permMod8[i + by0];
		b10 = permMod8[j + by0];
		b01 = permMod8[i + by1];
		b11 = permMod8[j + by1];
		
		sx = smooth(rx0);
		sy = smooth(ry0);
		
		u = rx0 * this.grad[b00][0] + ry0 * this.grad[b00][1];
		v = rx1 * this.grad[b10][0] + ry0 * this.grad[b10][1];
		a = interpolate(sx, u, v);
		
		u = rx0 * this.grad[b01][0] + ry1 * this.grad[b01][1];
		v = rx1 * this.grad[b11][0] + ry1 * this.grad[b11][1];
		b = interpolate(sx, u, v);
		
		return .5 * (1 + interpolate(sy, a, b));
	}
};