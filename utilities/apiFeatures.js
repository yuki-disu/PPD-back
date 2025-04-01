const db = require('../config/db');

class APIFeatures {
    constructor(queryString) {
        this.queryString = queryString;
        this.sqlQuery = 'SELECT * FROM estates';
        this.values = [];
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludeFields = ['page', 'sort', 'limit', 'fields'];
        excludeFields.forEach(field => delete queryObj[field]);

        let filters = [];

        // Mapping MongoDB-like operators to SQL equivalents
        const sqlOperators = {
            gte: '>=',
            gt: '>',
            lte: '<=',
            lt: '<'
        };

        for (const [key, value] of Object.entries(queryObj)) {
            if (!value) continue; // Skip empty values

            const match = key.match(/(.*)_(gte|gt|lte|lt)/);
            if (match) {
                const column = match[1];
                const operator = sqlOperators[match[2]];
                filters.push(`${column} ${operator} ?`);
                this.values.push(Number(value)); // Convert value to number
            } else {
                // Handle exact matches (convert numeric columns properly)
                if (!isNaN(value)) {
                    filters.push(`${key} = ?`);
                    this.values.push(Number(value)); // Convert to number for SQL
                } else {
                    filters.push(`${key} = ?`);
                    this.values.push(value);
                }
            }
        }

        // Ensure only available listings are shown
        filters.push("sold = 0");
        filters.push("visibleHouse = 1");

        if (filters.length > 0) {
            this.sqlQuery += " WHERE " + filters.join(" AND ");
        }

        console.log("Executing SQL:", this.sqlQuery, this.values); // Debugging output
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(', ');
            this.sqlQuery += ` ORDER BY ${sortBy}`;
        } else {
            this.sqlQuery += ` ORDER BY price DESC`;
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(', ');
            this.sqlQuery = this.sqlQuery.replace('*', fields);
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.sqlQuery += ` LIMIT ${limit} OFFSET ${skip}`;
        return this;
    }

    async execute() {
        const [rows] = await db.query(this.sqlQuery, this.values);
        return rows;
    }
}

module.exports = APIFeatures;
