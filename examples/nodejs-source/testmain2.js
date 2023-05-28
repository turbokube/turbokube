const log = () => console.log('in testmain2 at', process.argv[1]);
log();
setInterval(log, 5000);
