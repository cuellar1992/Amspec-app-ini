import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Agent from '../models/Agent.js';
import Berth from '../models/Berth.js';
import Chemist from '../models/Chemist.js';
import Sampler from '../models/Sampler.js';
import Surveyor from '../models/Surveyor.js';
import Terminal from '../models/Terminal.js';
import Client from '../models/Client.js';
import ProductType from '../models/ProductType.js';
import {
  agentsData,
  berthsData,
  chemistsData,
  samplersData,
  surveyorsData,
  terminalsData,
  clientsData,
  productTypesData,
} from './seedData.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('📝 Clearing existing data...');
    await Agent.deleteMany({});
    await Berth.deleteMany({});
    await Chemist.deleteMany({});
    await Sampler.deleteMany({});
    await Surveyor.deleteMany({});
    await Terminal.deleteMany({});
    await Client.deleteMany({});
    await ProductType.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Seed Agents
    console.log('👔 Seeding Agents...');
    await Agent.insertMany(agentsData);
    console.log(`✅ ${agentsData.length} agents created`);

    // Seed Berths
    console.log('🚢 Seeding Berths...');
    await Berth.insertMany(berthsData);
    console.log(`✅ ${berthsData.length} berths created`);

    // Seed Chemists
    console.log('🧪 Seeding Chemists...');
    await Chemist.insertMany(chemistsData);
    console.log(`✅ ${chemistsData.length} chemists created`);

    // Seed Samplers
    console.log('🔬 Seeding Samplers...');
    await Sampler.insertMany(samplersData);
    console.log(`✅ ${samplersData.length} samplers created`);

    // Seed Surveyors
    console.log('📋 Seeding Surveyors...');
    await Surveyor.insertMany(surveyorsData);
    console.log(`✅ ${surveyorsData.length} surveyors created`);

    // Seed Terminals
    console.log('🏭 Seeding Terminals...');
    await Terminal.insertMany(terminalsData);
    console.log(`✅ ${terminalsData.length} terminals created`);

    // Seed Clients
    console.log('🏢 Seeding Clients...');
    await Client.insertMany(clientsData);
    console.log(`✅ ${clientsData.length} clients created`);

    // Seed Product Types
    console.log('🛢️ Seeding Product Types...');
    await ProductType.insertMany(productTypesData);
    console.log(`✅ ${productTypesData.length} product types created`);

    console.log('\n✅ Database seeding completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
