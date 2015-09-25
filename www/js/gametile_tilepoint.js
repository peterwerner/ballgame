
// 
// Point attached to a GameTile
//		x, y world coords
//		position: "center", "up", "right", "down", "left"
function TilePoint (x, y, position) {
	this.x_initial = x;
	this.y_initial = y;
	this.position_initial = position;
	this.x = x;
	this.y = y;
	this.position = position;
}

// Rotate to the given angle about the given origin point
TilePoint.prototype.rotate = function(angle, ox, oy) {
	var coords = rotatePointAboutPoint(this.x_initial, this.y_initial, ox, oy, angle);
	this.x = coords[0];
	this.y = coords[1];
	// If the angle is not 90n deg, position is null
	if (angle % (Math.PI / 2) != 0)
		this.position = null;
	// Otherwise, rotate the initial position to get the true position
	else {
		var numRots = angle / (Math.PI / 2);
		var rotations = {"up":"right", "right":"down", "down":"left", "left":"up"};
		this.position = this.position_initial;
		for (var i = 0; i < numRots; i++)
			this.position = rotations[this.position];
	}
}