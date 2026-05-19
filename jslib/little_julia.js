var d3 = complex_dynamics.d3;
var opts = {'algorithm':'inverse_iteration', 'fill_size': 1, trail:false};
var width = Math.round(window.innerWidth*0.2); //200;
var height = width;
var canvas = d3.select("canvas")
	.attr('width', width)
	.attr('height', height)
var c1, c2, c_current, cnt=0;
c_current = {'re':-0.001, 'im':0}; //random_c();
julia = new complex_dynamics.QuadraticJuliaSet(c_current);
julia.generate(canvas.node(), opts);
mandel_x_scale = d3.scaleLinear()
	.domain([0,width])
	.range([-2,2]);
mandel_y_scale = d3.scaleLinear()
	.domain([height,0])
	.range([-2,2]);
function pt_to_complex(wh) {
	var w = wh[0];
	var h = wh[1];
	var x = mandel_x_scale(w);
	var y = mandel_y_scale(h);
	return {'re':x, 'im':y};
}
canvas
	.on("mousemove", function() {
		var c = pt_to_complex(d3.mouse(this));
		if(c.re*c.re + c.im*c.im < 4) {
			julia = new complex_dynamics.QuadraticJuliaSet(c);
			julia.generate(canvas.node(), opts);
		}
	})
// 	.on("mousemove", function() {
// 		var c_pointed = pt_to_complex(d3.mouse(this));
// 		c2 = {'re':(c_pointed.re + c_current.re)/2, 'im':(c_pointed.im + c_current.im)/2};
// 		c1 = {'re':c_current.re, 'im':c_current.im};
// 		c_current = {'re':c2.re, 'im':c2.im};
// 		start_time = Date.now();
// 		timer = d3.timer(trans_step);
// 	})
	.on("mouseleave", function() {
		c1 = pt_to_complex(d3.mouse(this));
		c2 = random_c();
		start_time = Date.now();
		timer = d3.timer(trans);
	})
	.on("mouseenter", function() {
		if(window.timer && timer.stop) {
			timer.stop()
		}
	})

function trans_step() {
	t = (Date.now()-start_time)/10;
	julia = new complex_dynamics.QuadraticJuliaSet({'re':t*c2.re+(1-t)*c1.re, 'im': t*c2.im+(1-t)*c1.im});
	julia.generate(canvas.node(), opts);
	if(t>1) {
		timer.stop()
		return false
	}
	else {
		return true
	}
}

function trans() {
	t = (Date.now()-start_time)/500;
	julia = new complex_dynamics.QuadraticJuliaSet({'re':t*c2.re+(1-t)*c1.re, 'im': t*c2.im+(1-t)*c1.im});
	julia.generate(canvas.node(), opts);
	if(t>1) {
		timer.stop()
		return false
	}
	else {
		return true
	}
}

function random_c() {
	re = 2*Math.random()-1.7;
	im = 1.5*Math.random()-0.75;
	return {'re':re, 'im':im}
}
