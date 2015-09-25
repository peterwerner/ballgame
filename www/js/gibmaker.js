
//
// Gib maker class
function GibMaker () {
	this.gibs = []
}

GibMaker.prototype.update = function(deltaTime) {
	for (var i = this.gibs.length - 1; i >= 0; i--) {
		this.gibs[i].update(deltaTime);
		if (this.gibs[i].markedForDeath)
			this.gibs.splice(i, 1);
	}
}

GibMaker.prototype.paint = function(canvasContext) {
	for (var i = 0; i < this.gibs.length; i++) {
		if (!this.gibs[i].markedForDeath)
			this.gibs[i].paint(canvasContext);
	}
}

GibMaker.prototype.makeExplosion = function(x, y, radius, color, alpha, lifeTime) {
	this.gibs.push( new Gib_fader_circle(x, y, radius, color, alpha, lifeTime) );
}



//
// Gib class - circle that fades out
function Gib_fader_circle (x, y, radius, color, alpha, lifeTime) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.radius = radius;
	this.alpha = alpha;
	this.lifeTime = lifeTime;
	this.timeAlive = 0;
	this.markedForDeath = false;
}
Gib_fader_circle.prototype.update = function(deltaTime) {
	this.radius = Math.max(0, this.radius - 0.5 * deltaTime / this.lifeTime);
	this.alpha = Math.max(0, this.alpha - 0.5 * deltaTime / this.lifeTime);
	this.timeAlive += deltaTime;
	if(this.timeAlive > this.lifeTime)
		this.markedForDeath = true;
}
Gib_fader_circle.prototype.paint = function(canvasContext) {
	canvasContext.fillStyle = this.color;
	var globalAlpha = canvasContext.globalAlpha;
	canvasContext.globalAlpha = this.alpha;
	canvasContext.beginPath();
	canvasContext.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
	canvasContext.fill();
	canvasContext.globalAlpha = globalAlpha;
}