const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const { SYSASM } = require('oracledb');
const { isLoggedIn } = require('../lib/auth');

//routes
router.get('/', controller.getIndex);

router.post('/', controller.postIndex);

router.get('/salir', controller.getSalir);

router.get('/vehiculos', isLoggedIn, controller.getVehiculos);

router.get('/vehiculos-vendidos', isLoggedIn, controller.getVehiculosVendidos);

router.get('/vehiculos-no-vendidos', isLoggedIn, controller.getVehiculosNoVendidos);

router.get('/ver-datos-vehiculo/:id', isLoggedIn, controller.getDatosVehiculo);

router.get('/mantenimientos-vehiculo/:id', isLoggedIn, controller.getMantenimientosVehiculo);

router.post('/registrar-mantenimiento/', isLoggedIn, controller.postRegistrarMantenimiento);

router.get('/detalles-mantenimiento/:id', isLoggedIn, controller.getDetallesMantenimiento);

router.get('/detalles-mantenimientos/:id', isLoggedIn, controller.getDetallesMantenimientos);

router.get('/actualizar-datos-vehiculo/:id', isLoggedIn, controller.getActualizarDatosVehiculo);

router.post('/actualizar-datos-vehiculo', isLoggedIn, controller.postActualizarDatosVehiculo);

router.post('/agregar-modelo', isLoggedIn, controller.postAgregarModelo);

router.post('/agregar-forma-pago', isLoggedIn, controller.postAgregarFormaPago);

router.post('/agregar-ubicacion', isLoggedIn, controller.postAgregarUbicacion);

router.post('/agregar-taller', isLoggedIn, controller.postAgregarTaller);

router.get('/repuestos', isLoggedIn, controller.getRepuestos);

router.get('/mantenimientos', isLoggedIn, controller.getMantenimientos);

router.get('/informes', isLoggedIn, controller.getInformes);

router.post('/generar-informe/', isLoggedIn, controller.postGenerarInforme);

router.get('/ver-informe/', isLoggedIn, controller.verInforme);

router.get('/auditoria', isLoggedIn, controller.getAuditoria);

router.get('/usuarios', isLoggedIn, controller.getUsuarios);

router.post('/usuarios', isLoggedIn, controller.postUsuarios);

router.get('/cambiar-clave', isLoggedIn, controller.getCambiarClave);

router.post('/cambiar-clave', isLoggedIn, controller.postCambiarClave);

module.exports = router;