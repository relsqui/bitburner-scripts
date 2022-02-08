export function hosts_by_distance(ns) {
	let queue = ["home"]
	for (let i = 0; i < queue.length; i++) {
		let neighbors = ns.scan(queue[i]).filter((host) => queue.indexOf(host) == -1);
		queue = queue.concat(neighbors);
	}
	// don't include home
	return queue.slice(1);
}