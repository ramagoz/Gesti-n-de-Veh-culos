const sql = require('mssql');

const config = {
    user: 'sisasig',
    password: 'Ru&BY`*\\<Yf_Wr4w',
    server: 'vsqlmt1.mercotec.com.py',
    database: 'dbDesarrolloFederico',
    "options": {
        "encrypt": true,
        "enableArithAbort": true
    }
};

(async() => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(config);
        let id = 1;
        const result = await sql.query(`select * from configuraciones where id=${id}`);
        console.log(result.recordset[0].impresora);
    } catch (err) {
        console.log(err);
    }
})();