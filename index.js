import {checkpoint,safeErrorCode} from './server/diagnostics.js';
checkpoint('entry-loaded');
try {
 const {loadEnvironment}=await import('./server/environment.js');
 await loadEnvironment();
 checkpoint('environment-loaded');
 const {start}=await import('./server/index.js');
 checkpoint('modules-loaded');
 await start({checkpoint});
} catch(error) {
 checkpoint('startup-failed',safeErrorCode(error));
 console.error('Huisrapport kon niet starten. Foutcode: '+safeErrorCode(error));
 process.exitCode=1;
}
