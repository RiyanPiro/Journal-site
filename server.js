// Import libraries
const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

// Set up the server
const url = 'mongodb://localhost:27017';
const dbName = 'journal';
const client = new MongoClient(url);

// Connect the static files
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Get the latest page
app.get('/latestPage', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    let latestPage = await db.collection('pages').find().sort({ pageNumber: -1 }).limit(1).toArray();
    if (latestPage.length > 0) {
      res.status(200).json(latestPage[0]);
    } else {
      res.status(404).send('No pages found');
    }
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error getting latest page');
  }
});

// Display data in the page
app.get('/getPage/:pageNumber', async (req, res) =>{
  try {
    await client.connect();
    const db = client.db(dbName);

    let page = await db.collection('pages').findOne({ pageNumber: parseInt(req.params.pageNumber) });
    if (page) {
      res.status(200).json(page);
    } else {
      res.status(404).send('Page not found');
    }
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error getting page data');
  }
});

// Save changes made to the page
app.post('/savePage', async (req, res) => {

  try {
    await client.connect();
    const db = client.db(dbName);

    let r = await db.collection('pages').findOneAndUpdate(
      { pageNumber: req.body.pageNumber },
      {
        $setOnInsert: { date: req.body.date },
        $set: { content: req.body.content }
      },
      { upsert: true }
    );
    res.status(200).send('Page data saved');
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error saving page data');
  }
});

// Delete the page by getting the page number
app.post('/deletePage', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    let r = await db.collection('pages').findOneAndDelete(
      { pageNumber: req.body.pageNumber }
    );
    res.status(200).send('Page deleted');
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error deleting page');
  }
});

// Delete documents with empty content
app.post('/deleteEmpty', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    let r = await db.collection('pages').deleteMany(
      { content: "" }
    );
    res.status(200).send('Empty pages deleted');
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error deleting empty pages');
  }
});

// Search for a page by date
app.post('/searchByDate', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    let pages = await db.collection('pages').find({ date: req.body.date }).toArray();
    if (pages.length > 0) {
      let pageNumbers = pages.map(page => page.pageNumber);
      res.status(200).json(pageNumbers);
    } else {
      res.status(404).send('No pages found');
    }
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error searching for page');
  }
});

// Search for a page by text content
app.post('/searchByText', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    let pages = await db.collection('pages').find({ content: { $regex: req.body.content, $options: 'i' } }).toArray();
    if (pages.length > 0) {
      let pageNumbers = pages.map(page => page.pageNumber);
      res.status(200).json(pageNumbers);
    } else {
      res.status(404).send('No pages found');
    }
  }
  catch (err) {
    console.log(err.stack);
    res.status(500).send('Error searching for page');
  }
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));