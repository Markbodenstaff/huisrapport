import {start} from './server/index.js';

start().catch(()=>{
 console.error('Huisrapport kon niet starten. Controleer de serverinstellingen.');
 process.exitCode=1;
});
