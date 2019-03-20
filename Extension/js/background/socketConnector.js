//* Create socket connection
var socket = io.connect('http://localhost:3020/'),
	tabPriorityInterval;

//* When connected start PreMiD functions
socket.on('connect', function() {
	PMD_info('Connected to Application');
	tabPriorityInterval = setInterval(tabPriority, 1 * 1000);
});

socket.on('disconnect', function() {
	PMD_error('Disconnected from Application');
	clearInterval(tabPriorityInterval);
});

socket.on('mediaKeyHandler', function(data) {
	//* Media control buttons
	PMD_info(`Media Control: ${data.playback}`);
});
