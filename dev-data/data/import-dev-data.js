const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const { Sequelize } = require('sequelize');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const db = require('../../config/db');
const User = require('../../models/userModel');
const Estates = require('../../models/estatesModel');

// Read JSON file
const dataFilePath = path.join(__dirname, 'houses-simple.json');
const estates = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

// Import data to database
const importData = async () => {
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');

    // Sync models
    await db.sync();
    console.log('Models synchronized successfully.');

    // Create the user if they don't exist
    const userId = 'eb02a4ff-62a8-431f-a903-6e88001cba2f';
    
    const [user, created] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        username: 'property_owner',
        firstname: 'Property',
        lastname: 'Owner',
        email: 'owner@example.com',
        password: 'tempPassword123', // In a real app, this should be hashed
        role: 'admin',
        active: true
      }
    });

    if (created) {
      console.log('User created successfully:', user.id);
    } else {
      console.log('User already exists:', user.id);
    }

    // Process each estate record
    for (const estate of estates) {
      try {
        // Map the data to match the new estates table schema
        const mappedEstate = {
          owner_id: userId, // Use our predefined user ID
          location: estate.location || 'Unknown location',
          description: estate.description || 'No description provided',
          type: estate.type || 'apartment',
          numOfRooms: estate.numOfRooms || 1,
          numOfBathroom: estate.numOfBathroom || 1,
          numOfKitchen: estate.numOfKitchen || 0,
          garageCapacity: estate.garageCapacity || 0,
          area: estate.area || 0,
          price: estate.price || 0,
          status: 'available',
          for_rent: estate.for_rent || false,
          imageCover: estate.imageCover || null,
          images: estate.images ? JSON.stringify(estate.images) : null,
          sold: false,
          rented: null,
          visibleHouse: true,
          centralHeating: estate.centralHeating || false,
          alarmsAndSecurity: estate.alarmsAndSecurity || false,
          fireDetector: estate.fireDetector || false,
          camera: estate.camera || false,
          parking: estate.parking || false,
          electricity: estate.electricity || false,
          gaz: estate.gaz || false,
          closeToTransportation: estate.closeToTransportation || false,
          closeToBeach: estate.closeToBeach || false,
          natureView: estate.natureView || false,
          elevator: estate.elevator || false,
          cleaning: estate.cleaning || false,
          petsAllowed: estate.petsAllowed || false,
          tv: estate.tv || false,
          dishwasher: estate.dishwasher || false,
          washingMachine: estate.washingMachine || false,
          wifi: estate.wifi || false,
          water: estate.water || false,
          microwave: estate.microwave || false,
          fridge: estate.fridge || false,
          closeToSchool: estate.closeToSchool || false,
          closeToSupermarket: estate.closeToSupermarket || false,
          garden: estate.garden || false,
          balcony: estate.balcony || false
        };

        await Estates.create(mappedEstate);
        console.log(`Estate imported: ${mappedEstate.location}`);
      } catch (err) {
        console.error(`Error importing estate ${estate.location || 'unknown'}:`, err.message);
      }
    }

    console.log('Data successfully imported to database!');
  } catch (err) {
    console.error('Error importing data:', err);
  } finally {
    process.exit();
  }
};

// Delete all data from estates table
const deleteData = async () => {
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');

    await Estates.destroy({ where: {}, truncate: true });
    console.log('All estate records deleted successfully!');
  } catch (err) {
    console.error('Error deleting data:', err);
  } finally {
    process.exit();
  }
};

// Command line arguments handling
if (process.argv[2] === '--import') {
  console.log('Starting import process...');
  importData();
} else if (process.argv[2] === '--delete') {
  console.log('Starting delete process...');
  deleteData();
} else {
  console.log('Command not recognized. Use --import or --delete');
  process.exit();
}