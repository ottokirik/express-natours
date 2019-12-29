const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION: ', err.name);
  process.exit(1);
});

dotenv.config({
  path: './config.env'
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

//Централизованная обработка асинхронных rejections
//возникших вне приложения (например при подключении к БД)
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION: ', err.name);
  server.close(() => {
    process.exit(1);
  });
});
