
// Rotate a point around an origin point using an angle in radians
function rotatePointAboutPoint(px, py, ox, oy, angle) {
	var transformX = Math.cos(angle) * (px-ox) - Math.sin(angle) * (py-oy) + ox;
	var transformY = Math.sin(angle) * (px-ox) + Math.cos(angle) * (py-oy) + oy;
	return [transformX, transformY];
}

/*
//
// Screen shaker
function ScreenShaker (canvasContext) {
	this.duration = 0;
	this.magnitude = 0;
	this.canvasContext = canvasContext;
	this.time = 0;
	this.x = 0;
}
ScreenShaker.prototype.shake = function(magnitude, rate, duration) {
	this.time = 0;
	this.x = 0;
	this.magnitude = magnitude;
	this.rate = rate;
	this.duration = duration;
}
ScreenShaker.prototype.update = function(deltaTime) {
	if (this.time < this.duration) {
		var dx = magnitude * rate / deltaTime;
		this.x += dx;
		this.canvasContext.translate(1, 0);
		if (this.x > magnitude)
			this.magnitude = -1 * this.magnitude;

		this.time += deltaTime;
	}
	else if (this.x != 0)
		this.canvasContext.translate(-1 * this.x, 0);
}
*/