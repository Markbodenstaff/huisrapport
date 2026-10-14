import {randomUUID} from 'node:crypto';
export const SHARED_SCHEMA=`CREATE TABLE IF NOT EXISTS huisrapport_shared_reports (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 created_at DATETIME(3) NOT NULL,
 snapshot MEDIUMTEXT NOT NULL
)`;
export const validReportId=id=>typeof id==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
export function sharedReports(pool){
 return {
  async save(snapshot){const id=randomUUID();await pool.execute('INSERT INTO huisrapport_shared_reports (id, created_at, snapshot) VALUES (?, ?, ?)',[id,new Date(),JSON.stringify(snapshot)]);return id;},
  async get(id){if(!validReportId(id))return null;const [rows]=await pool.execute('SELECT snapshot FROM huisrapport_shared_reports WHERE id = ?',[id]);return rows.length?JSON.parse(rows[0].snapshot):null;}
 };
}
