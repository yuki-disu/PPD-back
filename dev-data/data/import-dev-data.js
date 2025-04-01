const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import the database connection
const db = require('../../config/db');
const Estates = require('../../models/estatesModel');

// Read JSON file
const dataFilePath = path.join(__dirname, 'houses-simple.json');
const estates = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

// Import data to MySQL database
const importData = async () => {
  try {
    console.log('Starting to import data to MySQL database...');
    
    // Process each estate record
    for (const estate of estates) {
      // Map the data from your JSON file to match your estates table schema
      const mappedEstate = {
        owner_id: estate.owner_id || null,
        location: estate.location || null,
        description: estate.description || null,
        type: estate.type || null,
        numOfRooms: estate.numOfRooms || 0,
        numOfBathroom: estate.numOfBathroom || 0,
        numOfKitchen: estate.numOfKitchen || 0,
        garageCapacity: estate.garageCapacity || 0,
        area: estate.area || 0,
        price: estate.price || 0,
        status: estate.status || 'available',
        for_rent: estate.for_rent || false,
        imageCover: estate.imageCover || null,
        images: estate.images || null,
        sold: estate.sold || false,
        rented: estate.rented || null,
        visibleHouse: estate.visibleHouse || true,
        centralHeating: estate.centralHeating || false,
        alarmsAndSecurity: estate.alarmsAndSecurity || false,
        fireDetector: estate.fireDetector || false,
        camera: estate.camera || false,
        parking: estate.parking || false,
        electricity: estate.electricity || false,
        gaz: estate.gaz || false,
        closeToTransportation: estate.closeToTransportation || false,
        closeToBeach: estate.closeToBeach || false,
        natureView: estate.natureView || false
      };

      // Use the Estates.save method to save the data
      const result = await Estates.save(mappedEstate);
      
      if (!result.success) {
        console.error(`Failed to import estate: ${result.errors}`);
      }
    }

    console.log('Data successfully imported to MySQL database!');
  } catch (err) {
    console.error('Error importing data:', err);
  }
  process.exit();
};

// Delete all data from estates table
const deleteData = async () => {
  try {
    console.log('Deleting all estate records from MySQL database...');
    await db.execute('DELETE FROM estates');
    console.log('Data successfully deleted from MySQL database!');
  } catch (err) {
    console.error('Error deleting data:', err);
  }
  process.exit();
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