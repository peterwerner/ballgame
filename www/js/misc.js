
// Scale a ratio coordinate pair (0-1, 0-1) to fit this window (.7 is 70% of the window)
// Note: Keep in mind aspect ratios and how changing them can affect scaled velocities
function coordMod(i, j, width, height, x, y) {
	var retval = [];
	retval.push(x + (width * i));
	retval.push(y + (height * j));
	return retval;
}


// Get a random color in hex
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}