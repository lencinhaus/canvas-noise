noiseFunctions['simplex'] = {
	F: .5 * (Math.sqrt(3) - 1),
	G: (3 - Math.sqrt(3)) / 6,
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
		var n0, n1, n2, s, i, j, t, X0, Y0, x0, y0, i1, j1, x1, x2, y1, y2, ii, jj, gi0, gi1, gi2, t0, t1, t2;
		
		s = (x + y) * this.F;
		i = Math.floor(x + s);
		j = Math.floor(y + s);
		t = (i + j) * this.G;
		X0 = i - t;
		Y0 = j - t;
		x0 = x - X0;
		y0 = y - Y0;
		
		if(x0 > y0) {
			i1 = 1;
			j1 = 0;
		}
		else {
			i1 = 0;
			j1 = 1;
		}
		
		x1 = x0 - i1 + this.G;
		y1 = y0 - j1 + this.G;
		x2 = x0 - 1 + 2 * this.G;
		y2 = y0 - 1 + 2 * this.G;
		
		ii = i % args.size;
		jj = j % args.size;
		gi0 = permMod8[ii + perm[jj]];
		gi1 = permMod8[ii + i1 + perm[jj + j1]];
		gi2 = permMod8[ii + 1 + perm[jj + 1]];
		
		t0 = .5 - x0 * x0 - y0 * y0;
		if(t0 < 0) n0 = 0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * (this.grad[gi0][0] * x0 + this.grad[gi0][1] * y0);
		}
		
		t1 = .5 - x1 * x1 - y1 * y1;
		if(t1 < 0) n1 = 0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * (this.grad[gi1][0] * x1 + this.grad[gi1][1] * y1);
		}
		
		t2 = .5 - x2 * x2 - y2 * y2;
		if(t2 < 0) n2 = 0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * (this.grad[gi2][0] * x2 + this.grad[gi2][1] * y2);
		}
		
		return .5 + 35 * (n0 + n1 + n2);
	}
};