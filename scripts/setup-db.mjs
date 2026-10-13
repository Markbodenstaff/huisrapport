import {databasePool,SCHEMA} from '../server/storage.js';
import {HISTORY_SCHEMA} from '../server/history.js';
const pool=await databasePool();
if(!pool) throw new Error('Stel DB_HOST, DB_NAME, DB_USER en DB_PASSWORD in.');
try {await pool.execute(SCHEMA);await pool.execute(HISTORY_SCHEMA);console.log('Interessetabel gereed. Bestaande gegevens behouden.');}
finally {await pool.end();}
