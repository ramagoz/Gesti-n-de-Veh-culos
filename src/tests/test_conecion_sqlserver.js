const sql = require('mssql');
const { database } = require('../config');
console.log("Ejecutando . . .");

(async() => {
    try {
        let pool = await sql.connect(database);
        let result = await pool.request().query('select * from configuraciones');

        console.log(result.recordset[0].impresora);

    } catch (err) {
        console.log(err);
    }
})();