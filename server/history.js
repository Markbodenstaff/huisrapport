import {randomUUID} from 'node:crypto';
export const HISTORY_SCHEMA=`CREATE TABLE IF NOT EXISTS huisrapport_reports (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 created_at DATETIME(3) NOT NULL,
 address VARCHAR(255) NOT NULL,
 snapshot MEDIUMTEXT NOT NULL,
 INDEX reports_created_at (created_at)
)`;
export function retentionDays(value) {
 const days=Number(value);return [30,90,365].includes(days)?days:null;
}
export function reportHistory(pool,days) {
 if(!retentionDays(days)) throw new Error('Kies een geldige bewaartermijn.');
 const cutoff=()=>new Date(Date.now()-days*86400000);
 return {
  async purge(){await pool.execute('DELETE FROM huisrapport_reports WHERE created_at < ?', [cutoff()]);},
  async save(snapshot){const id=randomUUID();await pool.execute('INSERT INTO huisrapport_reports (id, created_at, address, snapshot) VALUES (?, ?, ?, ?)',[id,new Date(),snapshot.address.weergavenaam,JSON.stringify(snapshot)]);return id;},
  async list(page=1){const [rows]=await pool.execute('SELECT id, created_at, address FROM huisrapport_reports WHERE created_at >= ? ORDER BY created_at DESC, id DESC LIMIT 100 OFFSET ?',[cutoff(),(page-1)*100]);return rows;},
  async get(id){const [rows]=await pool.execute('SELECT snapshot FROM huisrapport_reports WHERE id = ? AND created_at >= ?',[id,cutoff()]);return rows.length?JSON.parse(rows[0].snapshot):null;}
 };
}
