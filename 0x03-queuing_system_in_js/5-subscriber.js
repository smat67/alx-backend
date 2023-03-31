import { createClient } from "redis";

const client = createClient();

client.on('connect', () => console.log('Redis client connected to the server'));
client.on('error', (err) => console.log(`Redis client not connected to the server: ${err}`));

client.subscribe('holberton school channel');

client.on('message', (channel, msg) => {
	if (channel === 'holberton school channel') {
		console.log(msg);

		if (msg === 'KILL_SERVER') {
			client.unsubscribe('holberton school channel');
			client.end(true);
		}
	}
});
