var fs = require('fs-extra');

package = () => {
	//* Chrome
	fs.removeSync('./Chrome');
	fs.copySync('./Extension', './Chrome');
	var manifest = require('./Chrome/manifest.json');
	delete manifest.applications;
	fs.writeFileSync('./Chrome/manifest.json', JSON.stringify(manifest));
};

package();
