const db = require('../config/db');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const estatesSchema = require('../Validators/estateValidator');
const User = require('./userModel');
const defaultEstateData = {
  id: null,
  owner_id: null,
  location: null,
  description: null,
  type: null,
  numOfRooms: null,
  numOfBathroom: null,
  numOfKitchen: null,
  garageCapacity: null,
  area: null,
  price: null,
  status: 'available',
  for_rent: 0,
  imageCover: null,
  images: null,
  createdAt: new Date(),
  sold: 0,
  rented: null,
  visibleHouse: 1,
  centralHeating: 0,
  alarmsAndSecurity: 0,
  fireDetector: 0,
  camera: 0,
  parking: 0,
  electricity: 0,
  gaz: 0,
  closeToTransportation: 0,
  closeToBeach: 0,
  natureView: 0,
};

class Estates {
  constructor(data) {
    Object.assign(this, defaultEstateData, data);
  }

  static async save(data) {
    try {
        const { error, value: estateData } = estatesSchema.validate(data, {
            abortEarly: false,
        });
        if (error) {
            return {
                success: false,
                errors: error.details.map((err) => err.message),
            };
        }

        // Generate UUID if not provided
        if (!estateData.id) {
            estateData.id = crypto.randomUUID();
        }

        const sql = `
            INSERT INTO estates (
                id, owner_id, location, description, type, numOfRooms, numOfBathroom, 
                numOfKitchen, garageCapacity, area, price, status, for_rent, imageCover, images, 
                createdAt, sold, rented, visibleHouse, centralHeating, alarmsAndSecurity, 
                fireDetector, camera, parking, electricity, gaz, closeToTransportation, 
                closeToBeach, natureView
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `;

        const values = [
            estateData.id,
            estateData.owner_id,
            estateData.location,
            estateData.description,
            estateData.type,
            estateData.numOfRooms,
            estateData.numOfBathroom,
            estateData.numOfKitchen,
            estateData.garageCapacity,
            estateData.area,
            estateData.price,
            estateData.status,
            estateData.for_rent,
            estateData.imageCover,
            estateData.images ? JSON.stringify(estateData.images) : null,
            new Date(),
            estateData.sold,
            estateData.rented,
            estateData.visibleHouse,
            estateData.centralHeating,
            estateData.alarmsAndSecurity,
            estateData.fireDetector,
            estateData.camera,
            estateData.parking,
            estateData.electricity,
            estateData.gaz,
            estateData.closeToTransportation,
            estateData.closeToBeach,
            estateData.natureView,
        ];

        const [result] = await db.execute(sql, values);
        return { success: true, estateId: estateData.id, errors: null };
    } catch (error) {
        console.error('Error saving estate:', error);
        return {
            success: false,
            estateId: null,
            errors: [error.message],
        };
    }
  }

  static findAll() {
    //implementation for find all
    let sql = 'SELECT * FROM estates';

    return db.execute(sql);
  }
  static findById(id) {
    let sql = `SELECT * FROM estates WHERE id = ?;`;
    return db.execute(sql, [id]);
  }
  static findByIdAndDelete(id) {
    let sql = `DELETE FROM estates WHERE id = ?;`;
    return db.execute(sql, [id]);
  }

  static async findByIdAndUpdate(id, body) {
    if (!id || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new Error('Invalid parameters');
    }

    // Build the SET clause dynamically
    const updates = Object.keys(body)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(body);

    const sql = `UPDATE estates SET ${updates} WHERE id = ?`;

    try {
      const [result] = await db.execute(sql, [...values, id]);

      // Check if any row was updated
      if (result.affectedRows === 0) {
        return null; // No estate found with that ID
      }

      return result;
    } catch (error) {
      console.error('Error updating estate:', error);
      throw error;
    }
  }
}

module.exports = Estates;
