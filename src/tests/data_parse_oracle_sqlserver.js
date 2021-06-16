const sql = require('mssql');
var oracledb = require('oracledb');
let { databaseOracle, databaseSqlServer } = require('../config');
let connection;
let datosVehiculos = '';

const ObtenerDatos = (async() => {

    try {
        connection = await oracledb.getConnection(databaseOracle);

        try {
            console.log("Actualizando datos de vehículos. . .");
            datosVehiculos = await connection.execute(`SELECT ART_CODIGO, ART_DESC, ART_COD_ALFANUMERICO, EXIST, TO_CHAR(FECHA_LLEGADA_IMPORT, 'YYYYMMDD') AS FECHA_LLEGADA_IMPORT, CLIENTE,
            TO_CHAR(FECHA_VTA, 'DD-MM-YYYY') AS FECHA_VTA, DET_CANT, DOC_SALDO_MON, MON_DESC
                from ADCS.STK_TD_FOTON_AUTOMOVILES `);
            connection.close();
        } catch (error) {
            console.log("Error al obtener datos de la BD Oracle: ", error);
            connection.close();
        }
        /* Orden en que se traen los datos desde Oracle
            0 - ART_CODIGO
            1 - ART_DESC
            2 - ART_COD_ALFANUMERICO
            3 - EXIST
            4 - FECHA_LLEGADA_IMPORT
            5 - CLIENTE
            6 - FECHA_VTA
            7 - DET_CANT
            8 - DOC_SALDO_MON
            9 - MON_DESC
        */

        datosVehiculos.rows.forEach(async(vehiculo) => {

            await sql.connect(databaseSqlServer);
            let id, chasis, cliente, desc, moneda, fecha_imp, fecha_vta, saldo, id_cliente = null;

            id = vehiculo[0];

            //verificamos si existe en la BD SqlServer el vehiculo
            try {
                let q = `select count(*) as cant from sgv_vehiculos where id =${id};`;
                let cantVehiculo = await sql.query(q);

                //si el vehiculo no existe lo cargamos a la BD
                if (cantVehiculo.recordset[0].cant === 0) {

                    // console.log("No existe vehiculo");

                    chasis = '\'' + vehiculo[2] + '\'';
                    desc = '\'' + vehiculo[1] + '\'';
                    saldo = vehiculo[8];

                    //verificamos si hay un cliente asociado al vehiculo
                    if (vehiculo[5] != null) {

                        cliente = vehiculo[5].split(' - ');
                        // console.log("Id cliente: ", cliente[0]);
                        id_cliente = cliente[0];
                        // console.log("Cliente: ", cliente[1]);

                        try {
                            let q = `select count(*) as cant from sgv_clientes where id =${cliente[0]};`;
                            let cantidadClientes = await sql.query(q);

                            //si cliente no existe lo cargamos a la BD
                            if (cantidadClientes.recordset[0].cant == 0) {
                                // console.log("Cliente no existe");
                                let q = `insert into sgv_clientes (id, cliente) values(${cliente[0]},\'${cliente[1]}\');`;

                                try {
                                    let r = await sql.query(q);
                                    // console.log(r);
                                } catch (error) {
                                    // console.log("Error al insertar cliente");
                                }
                            } else {
                                // console.log("Cliente existe");
                            }

                        } catch (error) {
                            // console.log("Error al obtener cantidad de cliente: ", error);
                        }
                    }

                    if (vehiculo[4] != null) {
                        fecha_imp = '\'' + vehiculo[4].toString() + '\'';
                    } else {
                        fecha_imp = null;
                    }

                    if (vehiculo[6] != null) {
                        fecha_vta = '\'' + vehiculo[6].toString() + '\'';
                    } else {
                        fecha_vta = null;
                    }

                    if (vehiculo[9] === 'DOLARES AMERICANOS') {
                        moneda = '\'USD\'';
                    } else if (vehiculo[9] === 'GUARANIES') {
                        moneda = '\'GS\'';
                    } else {
                        moneda = null;
                    }

                    try {
                        let insert = `insert into sgv_vehiculos (id, chasis, descripcion, fecha_imp, fecha_vta, saldo, moneda, id_cliente) 
                        values (${id},${chasis},${desc},convert(datetime, ${fecha_imp}, 103),convert(datetime, ${fecha_vta}, 103),${saldo},${moneda},${id_cliente});`;
                        // console.log(insert);
                        let result = await sql.query(insert);
                        // console.log(result);
                    } catch (err) {
                        console.log('Error al insertar vehiculo: ', err);
                    }

                    //si existe vehiculo actualizamos datos (chasis, saldo, fecha imp y fecha vta, id_cliente,moneda)
                } else {

                    // console.log("Existe vehiculo");

                    //verificamos si hay un cliente asociado al vehiculo
                    if (vehiculo[5] != null) {

                        cliente = vehiculo[5].split(' - ');
                        // console.log("Id cliente: ", cliente[0]);
                        id_cliente = cliente[0];
                        // console.log("Cliente: ", cliente[1]);

                        try {
                            let q = `select count(*) as cant from sgv_clientes where id =${cliente[0]};`;
                            let cantidadClientes = await sql.query(q);

                            //si cliente no existe lo cargamos a la BD
                            if (cantidadClientes.recordset[0].cant == 0) {
                                // console.log("Cliente no existe");
                                let q = `insert into sgv_clientes (id, cliente) values(${cliente[0]},\'${cliente[1]}\');`;

                                try {
                                    let r = await sql.query(q);
                                    // console.log(r);
                                } catch (error) {
                                    console.log("Error al insertar cliente");
                                }
                            } else {
                                // console.log("Cliente existe");
                            }

                        } catch (error) {
                            console.log("Error al obtener cantidad de cliente: ", error);
                        }
                    }

                    chasis = '\'' + vehiculo[2] + '\'';
                    saldo = vehiculo[8];

                    if (vehiculo[4] !== null) {
                        fecha_imp = '\'' + vehiculo[4].toString() + '\'';
                    } else {
                        fecha_imp = null;
                    }

                    if (vehiculo[6] !== null) {
                        fecha_vta = '\'' + vehiculo[6].toString() + '\'';
                    } else {
                        fecha_vta = null;
                    }

                    if (vehiculo[9] === 'DOLARES AMERICANOS') {
                        moneda = '\'USD\'';
                    } else if (vehiculo[9] === 'GUARANIES') {
                        moneda = '\'GS\'';
                    } else {
                        moneda = null;
                    }

                    try {
                        let update = `update sgv_vehiculos set chasis=${chasis}, fecha_imp=convert(datetime, ${fecha_imp}, 103),
                        fecha_vta = convert(datetime, ${fecha_vta}, 103), saldo= ${saldo}, id_cliente=${id_cliente}, moneda=${moneda} where id =${id};`;

                        console.log(update);
                        let result = await sql.query(update);
                        // console.log(result);
                    } catch (err) {
                        console.log('Error al actualizar datos de vehiculo: ', err);
                    }
                }

            } catch (err) {
                console.log('Error al obtener cantidad de vehiculos: ', err);
            }

        });

    } catch (error) {
        console.log('Fallo de conexion a la BD: ', error);

    }
});

const ActualizarDatosRepuestos = (async() => {
    let datosRepuestos = null;
    try {
        connection = await oracledb.getConnection(databaseOracle);
        try {
            console.log("Actualizando repuestos. . .");
            datosRepuestos = await connection.execute(`SELECT ART_CODIGO, ART_COD_ALFANUMERICO, ART_DESC, EXIST from ADCS.STK_TD_FOTON_REPUESTOS`); //WHERE ART_CODIGO=54336100029485
            connection.close();
        } catch (error) {
            console.log("Error al obtener datos de la BD Oracle: ", error);
            connection.close();
        }

        datosRepuestos.rows.forEach(async(repuesto) => {
            let pool = await sql.connect(databaseSqlServer)
            let id = repuesto[0];
            let cod_alfa = repuesto[1];
            let desc = repuesto[2];
            let exist = repuesto[3];

            try {
                let q = `select count(*) as cant from sgv_repuestos where id = id;`;

                let r = await pool.request()
                    .input('@id', sql.BigInt, id)
                    .query(q);

                //el repuesto no existe entonces lo cargamos a la BD
                if (r.recordset[0].cant < 1) {
                    try {
                        let q = `insert into sgv_repuestos (id, cod_alfa, descripcion, exist) values
                        (@id,@cod_alfa,@descripcion,@exist);`;

                        let r = await pool.request()
                            .input('id', sql.BigInt, id)
                            .input('cod_alfa', sql.VarChar(50), cod_alfa)
                            .input('descripcion', sql.VarChar(50), desc)
                            .input('exist', sql.Int, exist)
                            .query(q);

                        // if (r.rowsAffected[0] == 1) {
                        //     console.log("Producto insertado!");
                        // }

                    } catch (e) {
                        console.log("Error al insertar datos!", e);
                    }

                } else { //el repuesto ya existe, entonces se actualiza la existencia del mismo
                    try {
                        let q = `update sgv_repuestos set exist = @exist where id= @id`;

                        let r = await pool.request()
                            .input('id', sql.BigInt, id)
                            .input('exist', sql.Int, exist)
                            .query(q);

                        // if (r.rowsAffected[0] == 1) {
                        //     console.log("Producto actualizado!");
                        // }
                    } catch (e) {
                        console.log("Error al actualizar datos!", e);
                    }
                }

            } catch (e) {
                console.log("Error al consultar datos!", e);
            }

        });

    } catch (error) {
        console.log('Fallo de conexion a la BD: ', error);

    }
});


//intervalo de ejecucion 
var minutes = 1,
    intervalo = minutes * 60 * 1000; //se encuentra en milisegundos

//ejecutamos la actualizacion de la BD en intervalos de tiempo
// setInterval(function() {
//     console.log("Actualizando BD . . .");
//     console.log(getDate(new Date()));
//     ObtenerDatos();
//     ActualizarDatosRepuestos();
// }, intervalo);

// ObtenerDatos();
ActualizarDatosRepuestos();

function getDate(date) {
    var fecha = date.getDate() + '-' +
        (date.getMonth() + 1) + '-' + date.getFullYear();
    var hora = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    return fecha + ' ' + hora;
}