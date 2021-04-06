const ctrl = {};
let { databaseSqlServer } = require('../config');
let helpers = require('../lib/helpers');
const sql = require('mssql');

ctrl.getIndex = async(req, res) => {
    ssn = req.session;
    console.log('Variable session index: ', ssn.auth);
    if (ssn.auth) {
        res.render('index');
    } else {
        ssn.auth = false;
        res.render('auth/signin');
    }
};
ctrl.postIndex = async(req, res) => {
    const { username, password } = req.body;
    ssn = req.session;
    hash = await helpers.encryptPassword(password);
    console.log("Pass: ", hash);
    let query = `select * from sgv_usuarios where usuario=@usuario;`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('usuario', sql.VarChar(20), username)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    if (respuesta.recordset.length < 1) {
        console.log("Usuario no encontrado");
        let msjError = { msj: "Usuario no existe!" };
        res.render('auth/signin', { msjError });
    } else {
        passwordBD = respuesta.recordset[0].clave;
        ssn.user = respuesta.recordset[0].usuario;
        if (await helpers.matchPassword(password, passwordBD)) {
            console.log("Contraseña correcta!");
            ssn.auth = true;
            console.log('Variable session: ', ssn.auth);
            res.render('index');
        } else {
            let msjError = { msj: "Contraseña incorrecta!" };
            console.log("Contraseña incorrecta!");
            res.render('auth/signin', { msjError });
        }
    }
};
ctrl.getSalir = async(req, res) => {
    ssn = req.session;
    ssn.auth = false;
    ssn.destroy();
    console.log("Cerrando sesión.");
    res.render('auth/signin');
};
ctrl.getVehiculos = async(req, res) => {

    if (req.session.auth) {
        let vehiculos = "";

        try {
            await sql.connect(databaseSqlServer);
            vehiculos = await sql.query(`select v.chasis, v.chapa, c.cliente, v.descripcion, v.id
            from sgv_vehiculos v
            left join sgv_clientes c on c.id = v.id_cliente;`);
            console.log(vehiculos.recordset);

        } catch (error) {
            console.log(error);
            let msj = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/', { msj });
            return;
        }

        let check = false;

        res.render('vehiculos', { vehiculos, check });
    } else {
        req.session.auth = false;
        res.redirect('/');
    }
};
ctrl.getVehiculosVendidos = async(req, res) => {

    if (req.session.auth) {
        let vehiculos = "";

        try {
            await sql.connect(databaseSqlServer);
            vehiculos = await sql.query(`select v.chasis, v.chapa, c.cliente, v.descripcion, v.id
            from sgv_vehiculos v
            join sgv_clientes c on c.id = v.id_cliente;`);
        } catch (error) {
            console.log(error);
            let msj = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/', { msj });
            return;
        }

        let check = true;

        res.render('vehiculos', { vehiculos, check });
    } else {
        req.session.auth = false;
        res.redirect('/');
    }

};
ctrl.getDatosVehiculo = async(req, res) => {
    if (req.session.auth) {
        try {
            vehiculo = await ObtenerDatosVehiculoPorId(req.params.id);
        } catch (error) {
            console.log(error);
            let msj = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/vehiculos', { msj });
            return;
        }

        res.render('ver-datos-vehiculo', { vehiculo });
    } else {
        req.session.auth = false;
        res.redirect('/');
    }
}
ctrl.getActualizarDatosVehiculo = async(req, res) => {

    if (req.session.auth) {
        try {
            vehiculo = await ObtenerDatosVehiculoPorId(req.params.id);
            modelos = await ObtenerDatosModelos();
            talleres = await ObtenerDatosTalleres();
            formasPago = await ObtenerDatosFormasPago();
            ubicaciones = await ObtenerDatosUbicaciones();
        } catch (error) {
            console.log(error);
            let msjError = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/vehiculos', { msjError });
            return;
        }

        res.render('actualizar-datos-vehiculo', { vehiculo, modelos, talleres, formasPago, ubicaciones });
    } else {
        req.session.auth = false;
        res.redirect('/');
    }
}
ctrl.postActualizarDatosVehiculo = async(req, res) => {
    const { taller, modelo, ubicacion, formaPago, chapa, id } = req.body;
    console.log(req.body);

    let idTaller = await ObtenerIdTaller(taller);
    console.log(idTaller);
    let idModelo = await ObtenerIdModelo(modelo);
    console.log(idModelo);
    let idUbicacion = await ObtenerIdUbicacion(ubicacion);
    console.log(idUbicacion);
    let idFormaPago = await ObtenerIdFormaPago(formaPago);
    console.log(idFormaPago);

    let query = `update sgv_vehiculos set chapa=@chapa, id_taller=@idTaller, id_modelo=@idModelo,
      id_ubicacion=@idUbicacion, id_forma_pago=@idFormaPago where id=@id;`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('chapa', sql.VarChar(50), chapa)
            .input('idTaller', sql.Int, idTaller)
            .input('idModelo', sql.Int, idModelo)
            .input('idUbicacion', sql.Int, idUbicacion)
            .input('idFormaPago', sql.Int, idFormaPago)
            .input('id', sql.BigInt, id)
            .query(query);
        await pool.close();
        console.log(respuesta);
    } catch (error) {
        console.log(error);
    }

    let vehiculo = await ObtenerDatosVehiculoPorId(id);
    let msjOk = { msj: "Datos actualizados correctamente! " };

    res.render('ver-datos-vehiculo', { vehiculo, msjOk });
}
ctrl.postAgregarModelo = async(req, res) => {
    const { id, modelo } = req.body;
    let respuesta, vehiculo = null;
    let query = `insert into sgv_modelos (modelo) values(@modelo)`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('modelo', sql.VarChar(50), modelo)
            .query(query);
        modelos = await ObtenerDatosModelos();
        talleres = await ObtenerDatosTalleres();
        formasPago = await ObtenerDatosFormasPago();
        ubicaciones = await ObtenerDatosUbicaciones();
        await pool.close();
    } catch (error) {
        vehiculo = await ObtenerDatosVehiculoPorId(id);
        if (error.number === 2627) {
            let msjError = { msj: "El modelo ya existe! " + modelo };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        } else {
            console.log(error);
            let msjError = { msj: "Ocurrio un error al registrar el modelo! " + modelo };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        }
    }

    vehiculo = await ObtenerDatosVehiculoPorId(id);
    let msjOk = { msj: "Modelo creado correctamente! " };
    res.render('actualizar-datos-vehiculo', { vehiculo, msjOk, modelos, talleres, formasPago, ubicaciones });

};
ctrl.postAgregarFormaPago = async(req, res) => {
    const { id, formaPago } = req.body;
    let respuesta, vehiculo = null;
    let query = `insert into sgv_formas_de_pagos (forma) values(@formaPago)`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('formaPago', sql.VarChar(50), formaPago)
            .query(query);
        modelos = await ObtenerDatosModelos();
        talleres = await ObtenerDatosTalleres();
        formasPago = await ObtenerDatosFormasPago();
        ubicaciones = await ObtenerDatosUbicaciones();
        await pool.close();
    } catch (error) {
        vehiculo = await ObtenerDatosVehiculoPorId(id);
        if (error.number === 2627) {
            let msjError = { msj: "La forma de pago ya existe! " + formaPago };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        } else {
            console.log(error);
            let msjError = { msj: "Ocurrio un error al registrar la forma de pago! " + formaPago };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        }
    }

    vehiculo = await ObtenerDatosVehiculoPorId(id);
    let msjOk = { msj: "Forma de pago creada correctamente! " };
    res.render('actualizar-datos-vehiculo', { vehiculo, msjOk, modelos, talleres, formasPago, ubicaciones });
};
ctrl.postAgregarUbicacion = async(req, res) => {
    const { id, ubicacion } = req.body;
    let respuesta, vehiculo = null;
    let query = `insert into sgv_ubicaciones (ubi) values(@ubicacion)`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('ubicacion', sql.VarChar(50), ubicacion)
            .query(query);
        modelos = await ObtenerDatosModelos();
        talleres = await ObtenerDatosTalleres();
        formasPago = await ObtenerDatosFormasPago();
        ubicaciones = await ObtenerDatosUbicaciones();
        await pool.close();
    } catch (error) {
        vehiculo = await ObtenerDatosVehiculoPorId(id);
        if (error.number === 2627) {
            let msjError = { msj: "La ubicación ya existe! " + ubicacion };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        } else {
            console.log(error);
            let msjError = { msj: "Ocurrio un error al registrar la ubicación! " + ubicacion };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        }
    }

    vehiculo = await ObtenerDatosVehiculoPorId(id);
    let msjOk = { msj: "Ubicación registrada correctamente! " };
    res.render('actualizar-datos-vehiculo', { vehiculo, msjOk, modelos, talleres, formasPago, ubicaciones });
};
ctrl.postAgregarTaller = async(req, res) => {
    const { id, taller } = req.body;
    let respuesta, vehiculo = null;
    let query = `insert into sgv_talleres (taller) values(@taller)`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('taller', sql.VarChar(50), taller)
            .query(query);
        modelos = await ObtenerDatosModelos();
        talleres = await ObtenerDatosTalleres();
        formasPago = await ObtenerDatosFormasPago();
        ubicaciones = await ObtenerDatosUbicaciones();
        await pool.close();
    } catch (error) {
        vehiculo = await ObtenerDatosVehiculoPorId(id);
        if (error.number === 2627) {
            let msjError = { msj: "El taller ya existe! " + taller };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        } else {
            console.log(error);
            let msjError = { msj: "Ocurrio un error al registrar el taller! " + taller };
            res.render('actualizar-datos-vehiculo', { vehiculo, msjError });
            return;
        }
    }

    vehiculo = await ObtenerDatosVehiculoPorId(id);
    let msjOk = { msj: "Taller creado correctamente! " };
    res.render('actualizar-datos-vehiculo', { vehiculo, msjOk, modelos, talleres, formasPago, ubicaciones });
};
ctrl.getCambiarClave = async(req, res) => {
    if (req.session.auth) {
        res.render('cambiar-clave');
    } else {
        req.session.auth = false;
        res.redirect('/');
    }
};
ctrl.postCambiarClave = async(req, res) => {
    if (req.session.auth) {
        let msjOk, msjError;
        const { passwordActual, passwordNuevo, passwordConfirmar } = req.body;
        usuario = req.session.user;

        let query = `select * from sgv_usuarios where usuario=@usuario;`;

        try {
            let pool = await sql.connect(databaseSqlServer)
            respuesta = await pool.request()
                .input('usuario', sql.VarChar(20), usuario)
                .query(query);

        } catch (error) {
            console.log(error);
            return;
        }

        passwordBD = respuesta.recordset[0].clave;
        userId = respuesta.recordset[0].id;

        if (await helpers.matchPassword(passwordActual, passwordBD)) {
            console.log("Contraseña correcta!");

            if (passwordNuevo === passwordConfirmar) {
                try {
                    let respuesta = await GuardarNuevaClave(passwordNuevo, userId);
                    if (respuesta) {
                        msjOk = { msj: "Contraseña nueva actualizada!" };
                        console.log("Contraseña nueva actualizada!");
                    } else {
                        msjError = { msj: "Ocurrio un error al actualizar contraseña, favor intente de nuevo." };
                        console.log("Ocurrio un error al actualizar contraseña!");
                    }
                } catch (error) {
                    msjError = { msj: "Ocurrio un error al actualizar contraseña, favor intente de nuevo." };
                    console.log("Ocurrio un error al actualizar contraseña!");
                }
            } else {
                msjError = { msj: "Las contraseñas nuevas no coinciden!" };
                console.log("Contraseña actual incorrecta!");
            }
        } else {
            msjError = { msj: "Contraseña actual incorrecta!" };
            console.log("Contraseña actual incorrecta!");
        }
        res.render('cambiar-clave', { msjOk, msjError });

    } else {
        req.session.auth = false;
        res.render('auth/signin');
    }
};
//Funciones de apoyo
let ObtenerDatosTalleres = async(req, res) => {
    let query = `select * from sgv_talleres;`;
    try {
        await sql.connect(databaseSqlServer);
        talleres = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    talleres = talleres.recordset;
    return talleres;
}
let ObtenerDatosModelos = async(req, res) => {
    let query = `select * from sgv_modelos;`;
    try {
        await sql.connect(databaseSqlServer);
        modelos = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    modelos = modelos.recordset;
    return modelos;
}
let ObtenerDatosFormasPago = async(req, res) => {
    let query = `select * from sgv_formas_de_pagos;`;
    try {
        await sql.connect(databaseSqlServer);
        formaPago = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    formaPago = formaPago.recordset;
    return formaPago;
}
let ObtenerDatosUbicaciones = async(req, res) => {
    let query = `select * from sgv_ubicaciones;`;
    try {
        await sql.connect(databaseSqlServer);
        ubicaciones = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    ubicaciones = ubicaciones.recordset;
    return ubicaciones;
}
let ObtenerIdTaller = async(taller, req, res) => {
    let query = `select id from sgv_talleres where taller=@taller;`;
    try {
        let pool = await sql.connect(databaseSqlServer)
        id = await pool.request()
            .input('taller', sql.VarChar(50), taller)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    console.log(id);
    if (id.rowsAffected[0] == 0) {
        return null;
    } else {
        return id.recordset[0].id;
    }
}
let ObtenerIdModelo = async(modelo, req, res) => {
    let query = `select id from sgv_modelos where modelo=@modelo;`;
    try {
        let pool = await sql.connect(databaseSqlServer)
        id = await pool.request()
            .input('modelo', sql.VarChar(50), modelo)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    if (id.rowsAffected[0] == 0) {
        return null;
    } else {
        return id.recordset[0].id;
    }
}
let ObtenerIdUbicacion = async(ubicacion, req, res) => {
    let query = `select id from sgv_ubicaciones where ubi=@ubicacion;`;
    try {
        let pool = await sql.connect(databaseSqlServer)
        id = await pool.request()
            .input('ubicacion', sql.VarChar(50), ubicacion)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    if (id.rowsAffected[0] == 0) {
        return null;
    } else {
        return id.recordset[0].id;
    }
}
let ObtenerIdFormaPago = async(formaPago, req, res) => {
    let query = `select id from sgv_formas_de_pagos where forma=@formaPago;`;
    try {
        let pool = await sql.connect(databaseSqlServer)
        id = await pool.request()
            .input('formaPago', sql.VarChar(50), formaPago)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    if (id.rowsAffected[0] == 0) {
        return null;
    } else {
        return id.recordset[0].id;
    }
}
let ObtenerDatosVehiculoPorId = async(id, req, res) => {

    let query = `select v.id, v.chasis, v.descripcion, format(v.fecha_imp,'dd-MM-yyyy') as fecha_imp, format(v.fecha_vta,'dd-MM-yyyy') as fecha_vta, v.saldo, v.moneda, c.cliente,
    u.ubi, t.taller, m.modelo, fp.forma, v.chapa, v.obs
    from sgv_vehiculos v
    left join sgv_clientes c on c.id = v.id_cliente
    left join sgv_talleres t on t.id = v.id_taller
    left join sgv_ubicaciones u on u.id = v.id_ubicacion
    left join sgv_modelos m on m.id = v.id_modelo
    left join sgv_formas_de_pagos fp on fp.id = v.id_forma_pago
    where v.id = ${id};`;

    try {
        await sql.connect(databaseSqlServer);
        vehiculo = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    return vehiculo.recordset[0];
}
let GuardarNuevaClave = async(clave, userId, req, res) => {
    console.log("Pass nuevo sin encriptar: ", clave);
    clave = await helpers.encryptPassword(clave);
    console.log("Pass nuevo: ", clave);
    let query = `update sgv_usuarios set clave=@clave where id=@userId;`;

    try {
        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('clave', sql.VarChar(100), clave)
            .input('userId', sql.VarChar(20), userId)
            .query(query);

    } catch (error) {
        console.log(error);
        return false;
    }
    console.log('Respuesta cambio clave: ', respuesta.rowsAffected[0]);
    return true;
}

module.exports = ctrl;