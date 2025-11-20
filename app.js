const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const cors = require('cors'); 

const app = express();

mongoose.connect('mongodb+srv://anthony:anthonypietri@cluster0.yvlclit.mongodb.net/?appName=Cluster0',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(bodyParser.json());

app.use('/api/auth', userRoutes);


module.exports = app;
