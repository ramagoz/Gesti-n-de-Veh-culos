const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const { SYSASM } = require('oracledb');

//routes
router.get('/', controller.getIndex);

router.post('/', controller.postIndex);

router.get('/salir', controller.getSalir);

router.get('/vehiculos', controller.getVehiculos);

router.get('/vehiculos-vendidos', controller.getVehiculosVendidos);

router.get('/vehiculos-no-vendidos', controller.getVehiculosNoVendidos);

router.get('/ver-datos-vehiculo/:id', controller.getDatosVehiculo);

router.get('/mantenimientos-vehiculo/:id', controller.getMantenimientosVehiculo);

router.post('/registrar-mantenimiento/', controller.postRegistrarMantenimiento);

router.get('/detalles-mantenimiento/:id', controller.getDetallesMantenimiento);

router.get('/actualizar-datos-vehiculo/:id', controller.getActualizarDatosVehiculo);

router.post('/actualizar-datos-vehiculo', controller.postActualizarDatosVehiculo);

router.post('/agregar-modelo', controller.postAgregarModelo);

router.post('/agregar-forma-pago', controller.postAgregarFormaPago);

router.post('/agregar-ubicacion', controller.postAgregarUbicacion);

router.post('/agregar-taller', controller.postAgregarTaller);

router.get('/repuestos', controller.getRepuestos);

router.get('/auditoria', controller.getAuditoria);

router.get('/cambiar-clave', controller.getCambiarClave);

router.post('/cambiar-clave', controller.postCambiarClave);

module.exports = router;