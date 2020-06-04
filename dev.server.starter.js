//find dist/ -type f -exec sed "s/from '\(.*\)'/from '\1.js'/g" -i {} \
import {lstatSync, readdirSync, symlinkSync} from 'fs';
import {spawnSync} from 'child_process';

const makeSymLinks = (path) => {
    for (const name of readdirSync(path)) {
        const filePath = `${path}/${name}`;
        const stat = lstatSync(filePath);
        if (stat.isFile()) {
            if (name.endsWith('.js')) {
                try {
                    symlinkSync(name, `${path}/${name.slice(0, -3)}`);
                } catch (e) {
                    if (e.code !== 'EEXIST')
                        throw e;
                }
            }
        } else if (stat.isDirectory())
            makeSymLinks(filePath);
    }
};

makeSymLinks('./dist');


spawnSync('tsc --watch false', {stdio: 'inherit'});// cp.execSync('sed "s/from \'\\(.*\\)\'/from \'\\1.js\'/g"  -i dist/*');
spawnSync('node', ['./dist/server.js'], {stdio: 'inherit'});
// import './dist/server.js'
