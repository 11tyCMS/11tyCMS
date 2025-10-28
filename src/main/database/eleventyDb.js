const { Sequelize, DataTypes } = require('sequelize');
import { CMSDatabase } from './models';
let eleventyDB;
function initDbInstance(){
    const sequelize = new Sequelize('sqlite::memory');
    eleventyDB = new CMSDatabase(sequelize);
    return eleventyDB;
}

function get(){
    return eleventyDB
}

export default{
    initDbInstance,
    get
}

