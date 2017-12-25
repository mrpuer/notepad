const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const mongoURL = 'mongodb://localhost:27017/notepad';

const app = express();
const restAPI = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/pub`));

// роутим хтмл
restAPI.get('/', (req, res) => {
  res.sendFile('/pub/index.html');
});

// подключение к бд
const newDbConnection = (callback) => {
  MongoClient.connect(mongoURL, (err, db) => {
    if (err) {
      console.log(`Cant connect to DB. Error: ${err}`);
      res.send('Sorry. Cant connect to DB...');
    } else {
      const coll = db.collection('contacts');
      callback(coll);
    }
  });
  
};

// добавление контакта
restAPI.post('/api/contacts/', (req, res) => {
  const newContact = {
    firstName: req.body.fname,
    lastName: req.body.lname,
    phone: req.body.phone,
  };
  newDbConnection((collection) => {
    const lastContact = collection.find().sort({$natural:-1}).limit(1);
    lastContact.toArray((err, doc) => {
      if (!doc.length) {
        newContact.id = '1';
      } else {
        newContact.id = String(+doc[0].id + 1);
        collection.insertOne(newContact, (err, result) => {
          if (err) {
            console.log(`Cant connect to DB. Error: ${err}`);
            res.send('Sorry. Cant connect to DB...');
          } else {
            res.send(result);
          }
        });
      }
    });
  });
});

// список контактов
restAPI.get('/api/contacts/', (req, res) => {
  newDbConnection((collection) => {
    collection.find().toArray((error, doc) => {
      if (error) {
        console.log(error);
        res.send('Sorry. DB Error.');
      } else {
        res.send(doc);
      }
    });
  });
});

// удаление контакта
restAPI.delete('/api/contacts/:id', (req, res) => {
  newDbConnection((collection) => {
    collection.deleteOne({ id : `${req.params.id}` }, (err, result) => {
      if (err) {
        console.log(`Cant connect to DB. Error: ${err}`);
        res.send('Sorry. Cant connect to DB...');
      } else {
        res.send(result);
      }
    });
  });
});

// редактирование
restAPI.put('/api/contacts/:id', (req, res) => {
  const newData = {
    firstName: req.body.contact.fname,
    lastName: req.body.contact.lname,
    phone: req.body.contact.phone,
    id: req.params.id
  }
  newDbConnection((collection) => {
    collection.updateOne({ id : `${req.params.id}` }, newData, (err, result) => {
      if (err) {
        console.log(`Cant connect to DB. Error: ${err}`);
        res.send('Sorry. Cant connect to DB...');
      } else {
        res.send(result);
      }
    });
  });
});

//поиск
restAPI.get('/api/search/', (req, res) => {
  const searchData = {};
  searchData[req.query.where] = req.query.what
  newDbConnection((collection) => {
    collection.find(searchData).toArray((err, docs) => {
      if (err) {
        console.log(`Cant connect to DB. Error: ${err}`);
        res.send('Sorry. Cant connect to DB...');
      } else {
        res.send(docs);
      }
    });
  });
});

app.use('/', restAPI);
app.listen(3000, () => process.stdout.write('Server is running...\n'));
