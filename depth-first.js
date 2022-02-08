export function find_paths(ns, path=["home"], depth=1, maxDepth=null) {
	let current = path[path.length-1];
	let neighbors = ns.scan(current).filter((host) => path.indexOf(host) == -1);
	let paths = {};
	paths[current] = path.slice(1);
	if (!maxDepth || depth < maxDepth) {
		neighbors.forEach((host) => {
			Object.assign(paths, find_paths(ns, path.concat([host]), depth+1, maxDepth));
		});
	}
	return paths;
}