// apiFeatures.js
const { Op } = require('sequelize');

class APIFeatures {
  constructor(queryString) {
    this.queryString = queryString;
    this.queryOptions = {
      where: {},
      order: [],
      attributes: undefined,
      limit: 100,
      offset: 0,
    };
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);
  
    // Initialize where object with default filters
    this.queryOptions.where = {
      [Op.and]: [{ sold: false }, { visibleHouse: true }],
    };
  
    const operatorsMap = {
      gte: Op.gte,
      gt: Op.gt,
      lte: Op.lte,
      lt: Op.lt,
    };
  
    for (const [key, value] of Object.entries(queryObj)) {
      if (!value && value !== false) continue;
  
      // Exclude boolean fields with value 0 or false
      if (value === '0' || value === 0 || value === false) {
        continue;
      }
  
      // Special handling for wilaya parameter
      if (key === 'wilaya') {
        this.queryOptions.where[Op.and].push({
          location: {
            [Op.like]: `${value}%` // Match location starting with wilaya
          }
        });
        continue;
      }
  
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle operators like { gte: 5 }
        const operators = {};
        for (const [op, val] of Object.entries(value)) {
          if (operatorsMap[op]) {
            operators[operatorsMap[op]] = isNaN(val) ? val : Number(val);
          }
        }
        this.queryOptions.where[key] = operators;
      } else {
        // Handle exact match
        this.queryOptions.where[key] = isNaN(value) ? value : Number(value);
      }
    }
  
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(',');
      this.queryOptions.order = sortFields.map((field) => {
        if (field.startsWith('-')) {
          return [field.slice(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
    } else {
      // Default sorting
      this.queryOptions.order = [['price', 'DESC']];
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.queryOptions.attributes = this.queryString.fields.split(',');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const offset = (page - 1) * limit;

    this.queryOptions.limit = limit;
    this.queryOptions.offset = offset;
    return this;
  }

  async execute(Model) {
    return await Model.findAll(this.queryOptions);
  }
}

module.exports = APIFeatures;
