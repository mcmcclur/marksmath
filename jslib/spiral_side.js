if(window.innerWidth > 48) {
	d3 = IteratedFunctionSystems.d3;
	var sidebar = d3.select(".sidebar").append("canvas")
		.attr('class', 'pure-img hide-small')
		.attr("id", "spiral_plot");
	console.log(["canvas#spiral_plot", d3, sidebar.node()]);
	width = window.innerWidth*0.17;
	height = window.innerWidth*0.17;
	shift =  IteratedFunctionSystems.AffineFunction.shift;
	scale = IteratedFunctionSystems.AffineFunction.scale;
	rotate = IteratedFunctionSystems.AffineFunction.rotate;
	reflect = IteratedFunctionSystems.AffineFunction.reflect;
	degree = Math.PI/180;

	var function_list = function(r, theta) {
		return [
			rotate(theta).compose(scale(r)),
			shift([1,0]).compose(scale(0.1))
		];
	}
	options = {"axes":false, "colors":["black", "blue"],
		"width":width, "height":height, "canvas_id":"spiral_plot", "extent":[[-1.2,1.2],[-1.2,1.2]]};
	var r = Math.random()/4+3/4, theta = 2*Math.PI*Math.random();
	IFS = new IteratedFunctionSystems.IteratedFunctionSystem(function_list(r,theta));
	pts = IFS.stochastic_point_approximation(3000);
	IFS.point_plot(pts, options);


	worh_to_xory = d3.scaleLinear()
		.domain([0,width])
		.range([-1.2,1.2])

	function pt_to_rtheta(wh) {
		var w = wh[0];
		var h = wh[1];
		var x = worh_to_xory(w);
		var y = worh_to_xory(h);
		var r = Math.sqrt(x*x + y*y);
		var theta = -Math.atan2(y,x);
		return [r,theta];
	}

	d3.select("canvas#spiral_plot")
		.on("mousemove", function() {
			var rtheta = pt_to_rtheta(d3.mouse(this));
			var r = rtheta[0];
			var theta = rtheta[1];
			if (0.95 < r) { r = 0.95 };
			r = Math.pow(r,0.2);
			IFS = new IteratedFunctionSystems.IteratedFunctionSystem(function_list(r,theta));
			pts = IFS.stochastic_point_approximation(3000)
			IFS.point_plot(pts, options);
		})
		.on("mouseleave", function() {
			var rtheta = pt_to_rtheta(d3.mouse(this));
			var theta = rtheta[1];
			IFS = new IteratedFunctionSystems.IteratedFunctionSystem(function_list(0.95,theta));
			pts = IFS.stochastic_point_approximation(3000)
			IFS.point_plot(pts, options);
		})
}
