import { createClient } from "redis";
import { createQueue } from "kue";
import { promisify } from 'util';
import express from 'express';

const client = createClient();
const get = promisify(client.get).bind(client);
const queue = createQueue();
const app = express();


function reserveSeat(number) {
	client.set('available_seats', number);
}

async function getCurrentAvailableSeats() {
	return await get('available_seats');
}

reserveSeat(50);
let reservationEnabled = true;


app.get('/available_seats', async(req, res) => {
	return res.json({
		numberOfAvailableSeats: await getCurrentAvailableSeats(),
	});
});

app.get('/reserve_seat', (req, res) => {
	if (!reservationEnabled)
		return res.status(404).json({ status: 'Reservation are blocked' });
	
	let job = queue.create('reserve_seat', {});

	job.on('complete', () => {
		console.log(`Seat reservation job ${job.id} completed`);
	});
	job.on('failed', (err) => {
		console.log(`Seat reservation job ${job.id} failed: ${err}`);
	});

	job.save((err) => {
		if (!err) return res.json({ status: 'Reservation in process' });
		return res.status(404).json({ status: 'Reservation failed' });
	});
});

app.get('/process', (req, res) => {
	queue.process('reserve_seat', async (job, done) => {
		let seats = await getCurrentAvailableSeats();
		console.log(seats);
		if (seats <= 0) {
			reservationEnabled = false;
			done(Error('Not enough seats available'));
		} else {
			reserveSeat(seats - 1);
			done();
		}
	});

	return res.json({ status: 'Queue processing' });
});


app.listen(1245);
