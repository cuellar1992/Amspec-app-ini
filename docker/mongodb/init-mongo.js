// MongoDB initialization script
// This script runs when the container starts for the first time

// Switch to the application database
db = db.getSiblingDB('amspec');

// Create application user
db.createUser({
  user: 'amspec_user',
  pwd: 'amspec123',
  roles: [
    {
      role: 'readWrite',
      db: 'amspec'
    }
  ]
});

// Create initial collections and indexes
// Users collection
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

// Ship Nominations collection
db.createCollection('shipnominations');
db.shipnominations.createIndex({ nominationNumber: 1 }, { unique: true });
db.shipnominations.createIndex({ status: 1 });
db.shipnominations.createIndex({ eta: 1 });

// Sampling Rosters collection
db.createCollection('samplingrosters');
db.samplingrosters.createIndex({ rosterNumber: 1 }, { unique: true });
db.samplingrosters.createIndex({ status: 1 });
db.samplingrosters.createIndex({ samplingDate: 1 });

// Molekulis Loading collection
db.createCollection('molekulisLoading');
db.molekulisLoading.createIndex({ loadingNumber: 1 }, { unique: true });
db.molekulisLoading.createIndex({ status: 1 });
db.molekulisLoading.createIndex({ loadingDate: 1 });

// Other Jobs collection
db.createCollection('otherjobs');
db.otherjobs.createIndex({ jobNumber: 1 }, { unique: true });
db.otherjobs.createIndex({ status: 1 });
db.otherjobs.createIndex({ jobDate: 1 });

// Events collection
db.createCollection('events');
db.events.createIndex({ eventType: 1 });
db.events.createIndex({ eventDate: 1 });

// Agents collection
db.createCollection('agents');
db.agents.createIndex({ agentName: 1 }, { unique: true });

// Terminals collection
db.createCollection('terminals');
db.terminals.createIndex({ terminalName: 1 }, { unique: true });

// Surveyors collection
db.createCollection('surveyors');
db.surveyors.createIndex({ surveyorName: 1 }, { unique: true });

// Samplers collection
db.createCollection('samplers');
db.samplers.createIndex({ samplerName: 1 }, { unique: true });

// Product Types collection
db.createCollection('producttypes');
db.producttypes.createIndex({ productTypeName: 1 }, { unique: true });

// Passkeys collection
db.createCollection('passkeys');
db.passkeys.createIndex({ credentialID: 1 }, { unique: true });

print('MongoDB initialization completed successfully!');