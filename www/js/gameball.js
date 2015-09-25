
SPEED_MOD = .8

// 
// Game ball
function GameBall (type, color, score, radius, x, y) {
	this.type = type;
	this.color = color;
	this.score = score;
	this.radius = radius;
	this.speed = 1 / radius;
	this.x = x;
	this.y = y;
	this.parent = null;
	this.actionQueue = [];
	this.lastAction = null;
	this.markedForDeath = false;
}

// Move in the direction of the given point
GameBall.prototype.moveTo = function(deltaTime, px, py) {
	var diffX = - this.x + px,
		diffY = - this.y + py,
		distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
	if (deltaTime * this.speed * SPEED_MOD > distance) {
		this.x = px;
		this.y = py;
	}
	else {
		this.x += deltaTime * this.speed * SPEED_MOD * diffX / distance;
		this.y += deltaTime * this.speed * SPEED_MOD * diffY / distance;
	}
}

// Move in the direction of the given angle (in radians)
// RIGHT: pi / 2;  LEFT: 3 pi / 2;  UP: 0;  DOWN: pi
GameBall.prototype.moveByAngle = function(deltaTime, angle) {
	this.x += Math.sin(angle) * this.speed * SPEED_MOD * deltaTime;
	this.y -= Math.cos(angle) * this.speed * SPEED_MOD * deltaTime;
}

GameBall.prototype.paint = function(canvasContext) {
	canvasContext.fillStyle = this.color;
	canvasContext.beginPath();
	canvasContext.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
	canvasContext.fill();
}

// Mark this ball for death
GameBall.prototype.markForDeath = function() {
	this.markedForDeath = true;
}