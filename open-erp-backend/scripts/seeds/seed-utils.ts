import 'tsconfig-paths/register';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { connect, connection, Types } from 'mongoose';
// ---------------------------------------------------------------------------
// DB Connection (same pattern as other seed scripts)
// ---------------------------------------------------------------------------

export async function connectToDatabase(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const mongooseOpts = getMongooseOptions(dbConfig) as any;
  const connectUri = dbConfig.uri;

  const maskedAuth = dbConfig.user ? `${dbConfig.user}:***` : '(no-auth)';
  console.log('Connecting to MongoDB...');
  console.log(`  URI: ${connectUri}`);
  console.log(`  Database: ${mongooseOpts.dbName}`);
  console.log(`  Auth: ${maskedAuth}`);

  async function doConnect(uri: string, opts: any) {
    return await connect(uri, opts);
  }

  try {
    await doConnect(connectUri, {
      dbName: mongooseOpts.dbName,
      auth: mongooseOpts.auth,
      authSource: mongooseOpts.authSource,
      maxPoolSize: mongooseOpts.maxPoolSize,
      minPoolSize: mongooseOpts.minPoolSize,
      serverSelectionTimeoutMS: mongooseOpts.serverSelectionTimeoutMS,
      connectTimeoutMS: mongooseOpts.connectTimeoutMS,
      socketTimeoutMS: mongooseOpts.socketTimeoutMS,
      tls: mongooseOpts.tls,
      tlsAllowInvalidCertificates: mongooseOpts.tlsAllowInvalidCertificates,
      replicaSet: mongooseOpts.replicaSet,
    });
    console.log('✓ Connected to MongoDB');
  } catch (err: any) {
    console.error('Initial connection failed:', err?.message || err);
    if (dbConfig.user && dbConfig.pass) {
      const user = encodeURIComponent(dbConfig.user);
      const pass = encodeURIComponent(dbConfig.pass);
      const credentialedUri = connectUri.replace(
        /^(mongodb(\+srv)?:\/\/)/,
        `$1${user}:${pass}@`,
      );
      console.log('Retrying with credentials embedded in URI...');
      try {
        await doConnect(credentialedUri, {
          dbName: mongooseOpts.dbName,
          maxPoolSize: mongooseOpts.maxPoolSize,
          minPoolSize: mongooseOpts.minPoolSize,
          serverSelectionTimeoutMS: mongooseOpts.serverSelectionTimeoutMS,
          connectTimeoutMS: mongooseOpts.connectTimeoutMS,
          socketTimeoutMS: mongooseOpts.socketTimeoutMS,
          tls: mongooseOpts.tls,
          tlsAllowInvalidCertificates: mongooseOpts.tlsAllowInvalidCertificates,
          replicaSet: mongooseOpts.replicaSet,
        });
        console.log('✓ Connected to MongoDB with embedded credentials');
      } catch (err2: any) {
        console.error(
          'Retry with embedded credentials failed:',
          err2?.message || err2,
        );
        throw err2;
      }
    } else {
      throw err;
    }
  }
}
