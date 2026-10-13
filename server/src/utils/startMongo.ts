/**
 * Local MongoDB runner using mongodb-memory-server.
 * Runs on standard port 27017 so both the backend and seed script
 * can connect natively without requiring Docker Desktop.
 */
async function run(): Promise<void> {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'user_analytics',
    },
  });

  console.log(`✅ MongoDB local server started at: ${mongod.getUri()}`);
  console.log('Listening on port 27017 for incoming connections...');

  const cleanup = async () => {
    console.log('\nShutting down MongoDB server...');
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run().catch((err) => {
  console.error('Failed to start local MongoDB:', err);
  process.exit(1);
});
