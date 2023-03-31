import express from 'express';
import { createClient } from 'redis';
import { promisify } from 'util';

let app = express();
let client = createClient();
let get = promisify(client.get).bind(client);

let listProducts = [
	{ itemId: 1, itemName: 'Suitcase 250', price: 50, initialAvailableQuantity: 4 },
	{ itemId: 2, itemName: 'Suitcase 450', price: 100, initialAvailableQuantity: 10 },
	{ itemId: 3, itemName: 'Suitcase 650', price: 350, initialAvailableQuantity: 2 },
	{ itemId: 4, itemName: 'Suitcase 1050', price: 550, initialAvailableQuantity: 5 }
];


function getItemById(id) {
	for (let item of listProducts) {
		if (item.itemId === Number(id)) {
			return item;
		}
	}
	return null;
}

function reserveStockById(itemId, stock) {
	client.set(`item.${itemId}`, stock);
}

async function getCurrentReservedStockById(itemId) {
	let stock = await get(`item.${itemId}`);
	return stock;
}


app.get('/list_products', (req, res) => {
	return res.json(listProducts);
});

app.get('/list_products/:itemId', async (req, res) => {
	const { itemId } = req.params;

	let product = getItemById(itemId);
	if (!product) return res.status(404).json({ status: 'Product not found' });
	let stock = await getCurrentReservedStockById(itemId);
	product.currentQuantity = stock ? Number(stock) : product.initialAvailableQuantity;

	return res.json(product);
});

app.get('/reserve_product/:itemId', async (req, res) => {
	const { itemId } = req.params;

	let product = getItemById(itemId);
	if (!product) return res.status(404).json({ status: 'Product not found' });

	let stock = await getCurrentReservedStockById(itemId);
	if (!stock) {
		reserveStockById(itemId, product.initialAvailableQuantity - 1);
	} else {
		if (stock > 0) {
			reserveStockById(itemId, stock - 1);
		} else {
			return res.status(400).json({ status: "Not enough stock available", itemId: itemId });
		}
	}
	return res.json({ status: 'Reservation confirmed', itemId: itemId });
});


app.listen(1245);
