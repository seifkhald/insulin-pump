const { FORCE } = require('sequelize/lib/index-hints');
const database = require('./db_config');
const Sequelize = require("sequelize");

const Connector = new Sequelize(database.dbName,database.user,database.password,{
    host:database.Host,
    dialect:database.dialect
});


Connector.authenticate()
    .then(() => {
        console.log("Database connected successfully.");

        return Connector.sync({ alter: true });
    })
    .catch((err) => {
        console.error("Unable to connect to the database:",err);
    });


const db={};
db.Sequelize=Sequelize;
db.Connector=Connector;

module.exports=db;


