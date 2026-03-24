/**
 * db/index.js
 * NeDB datastore instances — one file per collection, stored in ./data/db/
 * Drop-in replacement for Mongoose models.
 */
const Datastore = require('nedb-promises');
const path = require('path');

const dir = path.join(__dirname, '../data/db');

const db = {
  users:     Datastore.create({ filename: path.join(dir, 'users.db'),     autoload: true }),
  incidents: Datastore.create({ filename: path.join(dir, 'incidents.db'), autoload: true }),
  ambulances:Datastore.create({ filename: path.join(dir, 'ambulances.db'),autoload: true }),
  districts: Datastore.create({ filename: path.join(dir, 'districts.db'), autoload: true }),
  sensors:   Datastore.create({ filename: path.join(dir, 'sensors.db'),   autoload: true }),
};

// Unique indexes
db.users.ensureIndex({ fieldName: 'email',      unique: true });
db.users.ensureIndex({ fieldName: 'userId',     unique: true });
db.incidents.ensureIndex({ fieldName: 'incidentId', unique: true });
db.ambulances.ensureIndex({ fieldName: 'ambulanceId', unique: true });
db.districts.ensureIndex({ fieldName: 'districtId',  unique: true });
db.sensors.ensureIndex({ fieldName: 'sensorId',      unique: true });

module.exports = db;
