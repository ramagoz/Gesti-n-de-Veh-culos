var oracledb = require('oracledb');

let database = {
    user: 'FEDERICO',
    password: 'TjXXJ94T',
    connectString: '10.8.0.3:1521/ORCL'
};

let connection;

(async(req, res) => {

    try {
        connection = await oracledb.getConnection(database);
        respuesta = await connection.execute(`select * from ADCS.STK_TD_FOTON_AUTOMOVILES`);
        console.log(respuesta.rows[0]);
    } catch (error) {
        console.log(error);
    }
})();