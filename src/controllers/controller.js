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
        let msjError = { msj: "Usuario no existe!" };
        res.render('auth/signin', { msjError });
    } else {
        passwordBD = respuesta.recordset[0].clave;
        ssn.user = respuesta.recordset[0].usuario;

        if (await helpers.matchPassword(password, passwordBD)) {
            ssn.auth = true;
            ssn.idUser = respuesta.recordset[0].id;
            ssn.idRol = respuesta.recordset[0].id_rol;
            res.redirect('/vehiculos');
        } else {
            let msjError = { msj: "Contraseña incorrecta!" };
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

        } catch (error) {
            console.log(error);
            let msj = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/', { msj });
            return;
        }

        let check = false;
        let check2 = false;

        res.render('vehiculos', { vehiculos, check, check2 });
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
ctrl.getVehiculosNoVendidos = async(req, res) => {

    if (req.session.auth) {
        let vehiculos = "";

        try {
            await sql.connect(databaseSqlServer);
            vehiculos = await sql.query(`select v.chasis, v.chapa, c.cliente, v.descripcion, v.id
            from sgv_vehiculos v
            left join sgv_clientes c on c.id = v.id_cliente
			where c.cliente is null;`);
        } catch (error) {
            console.log(error);
            let msj = { msj: "Ocurrio un error al recuperar datos." };
            res.redirect('/', { msj });
            return;
        }

        let check2 = true;

        res.render('vehiculos', { vehiculos, check2 });
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
ctrl.getDetallesMantenimiento = async(req, res) => {
    if (req.session.auth) {
        id = req.params.id;
        let vehiculo, repuestos, mantenimiento = '';

        try {
            idV = await ObtenerIdVehiculoPorIdMan(id);
            vehiculo = await ObtenerDatosVehiculoPorId2(idV);
            mantenimiento = await ObtenerMantenimientosPorIdMan(id);
            repuestos = await ObtenerRepuestosPorIdMan(id);
        } catch (error) {
            console.log(error);
        }
        console.log('Re: ', repuestos);
        res.render('detalles-mantenimiento', { idV, vehiculo, mantenimiento, repuestos });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
}
ctrl.getDetallesMantenimientos = async(req, res) => {
    if (req.session.auth) {
        id = req.params.id;
        let vehiculo, repuestos, mantenimiento = '';

        try {
            idV = await ObtenerIdVehiculoPorIdMan(id);
            vehiculo = await ObtenerDatosVehiculoPorId2(idV);
            mantenimiento = await ObtenerMantenimientosPorIdMan(id);
            repuestos = await ObtenerRepuestosPorIdMan(id);
        } catch (error) {
            console.log(error);
        }
        console.log('Re: ', repuestos);
        res.render('detalles-mantenimientos', { idV, vehiculo, mantenimiento, repuestos });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
}
ctrl.getMantenimientosVehiculo = async(req, res) => {
    if (req.session.auth) {
        let id = req.params.id;
        let vehiculo, repuesto, kms = '';
        console.log(id);
        try {
            vehiculo = await ObtenerDatosVehiculoPorId2(id);
            repuestos = await ObtenerRepuestos();
            kms = await ObtenerKms();
            mantenimientos = await ObtenerMantenimientos(id);
            talleres = await ObtenerDatosTalleres();
        } catch (error) {
            console.log(error);
            return;
        }
        console.log(vehiculo);
        res.render('mantenimientos-vehiculo', { vehiculo, repuestos, kms, mantenimientos, talleres });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
}
ctrl.postRegistrarMantenimiento = async(req, res) => {

    let { fecha, kmActual, kmRango, repuestos, cantidadRepuestos, obs, id, taller } = req.body;
    console.log(req.body);
    let id_mantenimiento,
        vehiculo, repuesto, kms, idTaller = '';

    //insertamos registro de mantenimiento
    try {
        idTaller = await ObtenerIdTaller(taller);
        console.log("Taller; ", taller);
        console.log("id taller; ", idTaller);

        let query = `insert into sgv_mantenimientos (id_vehiculo, id_kms, km, fecha, obs, id_taller) 
        values(@id_vehiculo, @id_kms, @km, @fecha, @obs, @id_taller)`;

        let pool = await sql.connect(databaseSqlServer)
        respuesta = await pool.request()
            .input('id_vehiculo', sql.BigInt, id)
            .input('id_kms', sql.Int, kmRango)
            .input('km', sql.Int, kmActual)
            .input('fecha', sql.DateTime, fecha)
            .input('obs', sql.VarChar(1000), obs)
            .input('id_taller', sql.Int, idTaller)
            .query(query);
        await pool.close();

    } catch (error) {
        console.log(error);
        return;
    }

    //obtenemos el id del mantenimiento
    try {
        query = `select top 1 id from sgv_mantenimientos order by id desc;`;

        let pool = await sql.connect(databaseSqlServer)
        idMantenimiento = await pool.request().query(query);
        await pool.close();

    } catch (error) {
        console.log(error);
        return;
    }
    idMantenimiento = idMantenimiento.recordset[0].id;

    //registramos los repuestos utilizados en el mantenimiento
    if (cantidadRepuestos.length == 1) {

        try {
            let query = `insert into sgv_repuestos_utilizados (id_mantenimiento, cod_alfa_repuesto, cantidad) 
            values(@id_mantenimiento, @cod_alfa_repuesto, @cantidad)`;

            let pool = await sql.connect(databaseSqlServer)
            respuesta = await pool.request()
                .input('id_mantenimiento', sql.Int, idMantenimiento)
                .input('cod_alfa_repuesto', sql.VarChar(50), repuestos.split(' - Cod: ')[1])
                .input('cantidad', sql.Int, cantidadRepuestos)
                .query(query);
            await pool.close();

        } catch (error) {
            console.log(error);
            return;
        }

    } else {

        for (let i = 0; i < cantidadRepuestos.length; i++) {

            try {
                let query = `insert into sgv_repuestos_utilizados (id_mantenimiento, cod_alfa_repuesto, cantidad) 
                values(@id_mantenimiento, @cod_alfa_repuesto, @cantidad)`;

                let pool = await sql.connect(databaseSqlServer)
                respuesta = await pool.request()
                    .input('id_mantenimiento', sql.Int, idMantenimiento)
                    .input('cod_alfa_repuesto', sql.VarChar(50), repuestos[i].split(' - Cod: ')[1])
                    .input('cantidad', sql.Int, cantidadRepuestos[i])
                    .query(query);
                await pool.close();
                console.log(respuesta);

            } catch (error) {
                console.log(error);
                return;
            }
        }
    }

    //recuperamos datos para actualizar vista de mantenimientos
    try {
        vehiculo = await ObtenerDatosVehiculoPorId2(id);
        repuestos = await ObtenerRepuestos();
        kms = await ObtenerKms();
        mantenimientos = await ObtenerMantenimientos(id);
        talleres = await ObtenerDatosTalleres();
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        msjAuditoria = 'Se ha registrado un mantenimiento del vehículo chasis ' + vehiculo.chasis;
        console.log("Registrando auditoria");
        await RegistrarAuditoria(req, msjAuditoria);
    } catch (error) {
        console.log(error);
    }

    let msjOk = { msj: "Mantenimiento registrado correctamente! " };

    res.render('mantenimientos-vehiculo', { vehiculo, repuestos, kms, msjOk, mantenimientos, talleres });
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

    //verificamos si los campos a actualizar están vacios
    if (chapa == '' & formaPago == '' & modelo == '' &
        ubicacion == '' & taller == '') {
        try {
            vehiculo = await ObtenerDatosVehiculoPorId(id);
            modelos = await ObtenerDatosModelos();
            talleres = await ObtenerDatosTalleres();
            formasPago = await ObtenerDatosFormasPago();
            ubicaciones = await ObtenerDatosUbicaciones();
        } catch (error) {
            console.log(error);
            return;
        }
        let msjError = { msj: "Los campos a actualzar están vacios! " };

        res.render('actualizar-datos-vehiculo', { vehiculo, modelos, talleres, formasPago, ubicaciones, msjError });
    } else {

        let idTaller = await ObtenerIdTaller(taller);
        let idModelo = await ObtenerIdModelo(modelo);
        let idUbicacion = await ObtenerIdUbicacion(ubicacion);
        let idFormaPago = await ObtenerIdFormaPago(formaPago);

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

        try {
            msjAuditoria = 'Se ha actualizado datos del vehículo chasis ' + vehiculo.chasis;
            console.log("Registrando auditoria");
            await RegistrarAuditoria(req, msjAuditoria);
        } catch (error) {
            console.log(error);
        }

        let msjOk = { msj: "Datos actualizados correctamente! " };

        res.render('ver-datos-vehiculo', { vehiculo, msjOk });
    }

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
    console.log(req.body);
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
ctrl.getRepuestos = async(req, res) => {
    if (req.session.auth) {

        let query = `select cod_alfa, descripcion, exist from sgv_repuestos where exist is not null;`;

        try {
            await sql.connect(databaseSqlServer);
            repuestos = await sql.query(query);

        } catch (error) {
            console.log(error);
            return;
        }
        repuestos = repuestos.recordset;

        res.render('repuestos', { repuestos });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
};
ctrl.getMantenimientos = async(req, res) => {
    if (req.session.auth) {

        let query = `select m.id, format(m.fecha,\'dd-MM-yyyy\') as fecha, c.cliente, m.km, k.kms, t.taller from sgv_mantenimientos m
        join sgv_vehiculos v on v.id = m.id_vehiculo
        join sgv_kilometrajes k on k.id = m.id_kms
        left join sgv_clientes c on v.id_cliente = c.id
        join sgv_talleres t on t.id = m.id_taller;`;

        try {
            await sql.connect(databaseSqlServer);
            mantenimientos = await sql.query(query);

        } catch (error) {
            console.log(error);
            return;
        }
        mantenimientos = mantenimientos.recordset;

        res.render('mantenimientos', { mantenimientos });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
};
ctrl.getAuditoria = async(req, res) => {
    if (req.session.auth) {

        let query = `select a.id, format(a.fecha,\'dd-MM-yyyy HH:mm:ss\') as fecha, u.usuario, a.accion from sgv_auditoria a
        join sgv_usuarios u on u.id = a.id_usuario;`;

        try {
            await sql.connect(databaseSqlServer);
            auditoria = await sql.query(query);

        } catch (error) {
            console.log(error);
            return;
        }
        console.log(auditoria);

        auditoria = auditoria.recordset;

        res.render('auditoria', { auditoria });

    } else {
        req.session.auth = false;
        res.redirect('/');
    }
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
let ObtenerDatosTalleres = async() => {
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
let ObtenerDatosModelos = async() => {
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
let ObtenerDatosFormasPago = async() => {
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
let ObtenerDatosUbicaciones = async() => {
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
let ObtenerIdTaller = async(taller, ) => {
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
let ObtenerIdModelo = async(modelo, ) => {
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
let ObtenerIdUbicacion = async(ubicacion, ) => {
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
let ObtenerIdFormaPago = async(formaPago, ) => {
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
    console.log('Forma de pago: ', id);
    if (id.rowsAffected[0] == 0) {
        return null;
    } else {
        return id.recordset[0].id;
    }
}
let ObtenerDatosVehiculoPorId = async(id, ) => {

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
let GuardarNuevaClave = async(clave, userId, ) => {
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
let ObtenerDatosVehiculoPorId2 = async(id, ) => {

    let vehiculo = '';
    let query = `select v.id, v.chasis, v.descripcion, c.cliente
     from sgv_vehiculos v
     left join sgv_clientes c on c.id = v.id_cliente
     where v.id = ${id};`;

    try {
        await sql.connect(databaseSqlServer);
        vehiculo = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    console.log(vehiculo);
    return vehiculo.recordset[0];
}
let ObtenerKms = async() => {

    try {
        query = `select id, kms from sgv_kilometrajes;`;
        await sql.connect(databaseSqlServer);
        kms = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    return kms.recordset;
}
let ObtenerMantenimientos = async(id) => {

    try {
        await sql.connect(databaseSqlServer);
        query = `select m.id, m.km, k.kms,  format(m.fecha,\'dd-MM-yyyy\') as fecha from sgv_mantenimientos m
        join sgv_kilometrajes k on k.id = m.id_kms where m.id_vehiculo = ${id} order by id desc;`;
        mantenimientos = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    return mantenimientos.recordset;
}
let ObtenerMantenimientosPorIdMan = async(id) => {

    try {
        await sql.connect(databaseSqlServer);
        query = `select m.id, m.km, k.kms,  format(m.fecha,\'dd-MM-yyyy\') as fecha, obs, t.taller 
         from sgv_mantenimientos m
         join sgv_kilometrajes k on k.id = m.id_kms
         join sgv_talleres t on t.id = m.id_taller 
         where m.id = ${id} order by id desc;`;
        mantenimientos = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    return mantenimientos.recordset[0];
}
let ObtenerRepuestos = async() => {

    try {
        query = `select concat(descripcion,\' - Cod: \',cod_alfa) as repuesto from sgv_repuestos;`;
        await sql.connect(databaseSqlServer);
        repuestos = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    return repuestos.recordset;
}
let ObtenerIdVehiculoPorIdMan = async(id) => {

    try {
        await sql.connect(databaseSqlServer);
        query = `select id_vehiculo as id from sgv_mantenimientos where id = ${id};`;
        idV = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    return idV.recordset[0].id;
}
let ObtenerRepuestosPorIdMan = async(id) => {

    try {
        await sql.connect(databaseSqlServer);
        query = `select r.descripcion, ru.cantidad from sgv_repuestos_utilizados ru
        join sgv_repuestos r on r.cod_alfa = ru.cod_alfa_repuesto
        where ru.id_mantenimiento = ${id};`;
        repuestos = await sql.query(query);

    } catch (error) {
        console.log(error);
        return;
    }

    return repuestos.recordset;
}
let RegistrarAuditoria = async(req, accion) => {

    try {
        let pool = await sql.connect(databaseSqlServer);

        query = `insert into sgv_auditoria (id_usuario, fecha, accion)
        values (@id_usuario, getdate(), @accion);`;

        respuesta = await pool.request()
            .input('id_usuario', sql.Int, req.session.idUser)
            .input('accion', sql.VarChar(500), accion)
            .query(query);

    } catch (error) {
        console.log(error);
        return;
    }
    console.log("Auditoria", respuesta);
    return repuestos.recordset;
}



module.exports = ctrl;