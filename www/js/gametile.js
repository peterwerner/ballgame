
// 
// Game tile
function GameTile (x, y, width, connections) {
	// Aesthetic options
	this.color = "#4F4F4F";
	this.barWidth = width / 5;
	// Dimensions
    this.x = x;
	this.y = y;
	this.width = width;
	// Intiial up down right left connections
	this.tilePoints = [];
	this.tilePoints.push( new TilePoint(x + width / 2, y + width / 2, "center") );
	for (i = 0; i < connections.length; i++) {
		var coords = this.coordsFromKey(connections[i]);
		this.tilePoints.push( new TilePoint(coords[0], coords[1], connections[i]) );
	}
	// Angle of rotation (in radians)
	this.rotAngle = 0;
	this.rotAngleOld = 0;
	this.rotAngleTarget = 0;
	// Balls with this as parent
	this.balls = [];
}




GameTile.prototype.update = function(deltaTime) {
	this.rotAngleOld = this.rotAngle;
	this.rotAngle %= (2 * Math.PI);
	if (this.rotAngle != this.rotAngleTarget) {
		// Rate at which to rotate
		var rotSpeed = .025;
		// Gradually rotate towards the target
		var delta = deltaTime * rotSpeed;
		var targetAdjusted = this.rotAngleTarget;
		if (targetAdjusted == 0)
			targetAdjusted = 2 * Math.PI;
		if (Math.abs(this.rotAngle - targetAdjusted) <= delta)
			this.rotAngle = this.rotAngleTarget;
		else
			this.rotAngle += delta;
	}
	this.rotAngle %= (2 * Math.PI);

	// Rotate the tilePoints
	for (var i = 0; i < this.tilePoints.length; i++) {
		this.tilePoints[i].rotate(this.rotAngle, this.x + this.width / 2, this.y + this.width / 2);
	}
	// Rotate the balls with the tile
	for (var i = 0; i < this.balls.length; i++) {
		var hw = this.width / 2,
			ball = this.balls[i];
		var coords = rotatePointAboutPoint(ball.x, ball.y, this.x + hw, this.y + hw, this.rotAngle - this.rotAngleOld)
		ball.x = coords[0];
		ball.y = coords[1];
	}
	// Move the balls
	for (var i = 0; i < this.balls.length; i++) {
		var ball = this.balls[i];
		if (ball.actionQueue.length < 1)
			continue;
		ball.moveTo(deltaTime, ball.actionQueue[0].x, ball.actionQueue[0].y);
		if (ball.x == ball.actionQueue[0].x  &&  ball.y == ball.actionQueue[0].y)
			ball.lastAction = ball.actionQueue.shift();
	}
}





GameTile.prototype.paint = function(canvasContext) {
	canvasContext.fillStyle = this.color;
	canvasContext.beginPath();
	canvasContext.arc(this.x + this.width / 2, this.y + this.width / 2, this.barWidth / 2 , 0, 2*Math.PI);
	canvasContext.fill();
	for (var i = 0; i < this.tilePoints.length; i++) {
		var angle = this.angleFromKey(this.tilePoints[i].position_initial);
		if (angle != null)
			this.drawArm(canvasContext, angle + this.rotAngle);
	}
}

GameTile.prototype.paintBalls = function(canvasContext) {
	for (var i = 0; i < this.balls.length; i++)
		this.balls[i].paint(canvasContext);
}

// Draw an up arm rotated to the specified angle (in radians)
GameTile.prototype.drawArm = function(canvasContext, angle) {
	diffs = [(this.width - this.barWidth) / 2, (this.width + this.barWidth) / 2];
	// Unrotated points
	points = [
		{'x':this.x + diffs[0], 'y':this.y},
		{'x':this.x + diffs[1], 'y':this.y},
		{'x':this.x + diffs[1], 'y':this.y + this.width / 2},
		{'x':this.x + diffs[0], 'y':this.y + this.width / 2},
	];
	// Rotate the points
	for (i = 0; i < points.length; i++) {
		var halfWidth = this.width / 2;
		var c = rotatePointAboutPoint(points[i]['x'], points[i]['y'], this.x + halfWidth, this.y + halfWidth, angle);
		points[i]['x'] = c[0];
		points[i]['y'] = c[1];
	}
	// Paint the arm
	canvasContext.beginPath();
	canvasContext.moveTo(points[0]['x'], points[0]['y']);
	for (i = 1; i < points.length; i++)
		canvasContext.lineTo(points[i]['x'], points[i]['y']);
	canvasContext.closePath();
	canvasContext.fill();
}




// Rotate the tile 90 degrees
GameTile.prototype.rotate90 = function() {
	this.rotAngleTarget = (this.rotAngleTarget + Math.PI / 2) % (2 * Math.PI);
}




// Attempt to parent the given ball to the given effective point
// 	Return true / false depending on success
GameTile.prototype.attemptParent = function(ball, effectiveKey) {
	for (i = 0; i < this.tilePoints.length; i++) {
		if (this.tilePoints[i].position == effectiveKey) {
			// Update the ball's destination queue
			ball.actionQueue = [this.tilePoints[0]];
			ball.actionQueue.push(this.getExitPoint(this.tilePoints[i]));
			// Add the ball to balls list
			this.balls.push(ball);
			return true;
		}
	}
	return false;
}




// Return the world coords [x,y] given a direction key
GameTile.prototype.coordsFromKey = function(key) {
	switch(key) {
	    case "up":
	        return [this.x + this.width / 2, this.y];
	    case "down":
	        return [this.x + this.width / 2, this.y + this.width]; 
	    case "left":
	        return [this.x, this.y + this.width / 2];
	    case "right":
	        return [this.x + this.width, this.y + this.width / 2]; 
	    default:
	        return null;
	}
}

// Return the angle that matches a given direction key
GameTile.prototype.angleFromKey = function(key) {
	switch(key) {
	    case "up":
	        return 0;
	    case "down":
	        return Math.PI; 
	    case "left":
	        return 3 * Math.PI / 2;
	    case "right":
	        return Math.PI / 2; 
	    default:
	        return null;
	}
}


// Given an entry tilePoint, get an exit tilePoint
GameTile.prototype.getExitPoint = function(entry) {
	// If there is a straight path, return it
	var opposites = {"up": "down", "down": "up", "left": "right", "right": "left"};
	for (i = 0; i < this.tilePoints.length; i++) {
		if (this.tilePoints[i].position_initial == opposites[entry.position_initial])
			return this.tilePoints[i];
	}
	// If there is a left-adjacent path, return it
	var leftAdj = {"up": "left", "down": "right", "left": "down", "right": "up"};
	for (i = 0; i < this.tilePoints.length; i++) {
		if (this.tilePoints[i].position_initial == leftAdj[entry.position_initial])
			return this.tilePoints[i];
	}
	// If there is a right-adjacent path, return it
	var rightAdj = {"up": "right", "down": "left", "left": "up", "right": "down"};
	for (i = 0; i < this.tilePoints.length; i++) {
		if (this.tilePoints[i].position_initial == rightAdj[entry.position_initial])
			return this.tilePoints[i];
	}
	// Otherwise, return the original direction
	return entry;
}



// Is the given coordinate pair within this' scope?
GameTile.prototype.checkCoords = function(inX, inY, tolerance) {
	if (inX > this.x - tolerance  &&  inX < this.x + this.width + tolerance  &&  inY > this.y - tolerance  &&  inY < this.y + this.width + tolerance) {
		return true;
	}
	return false;
}
