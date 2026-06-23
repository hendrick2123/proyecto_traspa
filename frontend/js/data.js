// =====================================================
// DATOS INICIALES (seed data)
// =====================================================

const EMPRESAS_DEFAULT = [
  {id:'TOKIO',    nombre:'Desarrolladora Tokio SA de CV',          rfc:'DTO150312L98'},
  {id:'JOGOR',    nombre:'Residencial Jogor SA de CV',             rfc:'IJO170329QZ3'},
  {id:'MARGOPH',  nombre:'Margoph SA de CV',                       rfc:'MAR170907EZ1'},
  {id:'ERATO',    nombre:'Erato Bienes Raíces SA de CV',           rfc:'EBR250108RL4'},
  {id:'LETGAB',   nombre:'Letgab SAPI de CV',                      rfc:'LET170405LQ6'},
  {id:'ZIBACASAS',nombre:'Zibacasas SA de CV',                     rfc:'ZIB1211063X4'},
  {id:'REM',      nombre:'Residencial Eduardo Molina SA de CV',    rfc:'REM130222142A'},
  {id:'ADW',      nombre:'Desarrolladora ADW SA de CV',            rfc:'DAD1506043H2'},
  {id:'SOFITER',  nombre:'Sofiter SA de CV',                       rfc:'SOF191008G24'},
];

const CC_DEFAULT = [
  {id:'CC001',empresaId:'TOKIO',    nombre:'Othon Park',          direccion:'Othon Mendizabal 10'},
  {id:'CC002',empresaId:'TOKIO',    nombre:'Ayanna Tepeyac',      direccion:'Calz. Guadalupe 386'},
  {id:'CC003',empresaId:'TOKIO',    nombre:'Boleo Park 2',        direccion:'Boleo 52-A'},
  {id:'CC004',empresaId:'TOKIO',    nombre:'Floresta 1',          direccion:'Norte 71-2336'},
  {id:'CC005',empresaId:'TOKIO',    nombre:'Vista Jardín',        direccion:'Calle 15-228'},
  {id:'CC006',empresaId:'TOKIO',    nombre:'Jamaica Park',        direccion:'Rancho Cruz 46'},
  {id:'CC007',empresaId:'TOKIO',    nombre:'Tokio 616',           direccion:'CDMX'},
  {id:'CC008',empresaId:'TOKIO',    nombre:'Toltecas 171',        direccion:'CDMX'},
  {id:'CC009',empresaId:'JOGOR',    nombre:'Alameda Park',        direccion:'Guerrero 55'},
  {id:'CC010',empresaId:'JOGOR',    nombre:'Oriente 233',         direccion:'CDMX'},
  {id:'CC011',empresaId:'JOGOR',    nombre:'Calle 4',             direccion:'CDMX'},
  {id:'CC012',empresaId:'MARGOPH',  nombre:'Vista Aeropuerto',    direccion:'Norte 5-211'},
  {id:'CC013',empresaId:'MARGOPH',  nombre:'SM Park 3',           direccion:'Flores Magón 531'},
  {id:'CC014',empresaId:'MARGOPH',  nombre:'Floresta 2',          direccion:'Poniente 44-3612'},
  {id:'CC015',empresaId:'MARGOPH',  nombre:'Floresta 3',          direccion:'Poniente 44-3730'},
  {id:'CC016',empresaId:'ERATO',    nombre:'Vértiz Park',         direccion:'CDMX'},
  {id:'CC017',empresaId:'ERATO',    nombre:'Alameda Park 2',      direccion:'CDMX'},
  {id:'CC018',empresaId:'ERATO',    nombre:'Vista Norte',         direccion:'Norte 7A-4934'},
  {id:'CC019',empresaId:'ERATO',    nombre:'Tamagno 121',         direccion:'CDMX'},
  {id:'CC020',empresaId:'LETGAB',   nombre:'Vitea Gardens',       direccion:'Querétaro'},
  {id:'CC021',empresaId:'LETGAB',   nombre:'Vista Vértiz',        direccion:'CDMX'},
  {id:'CC022',empresaId:'LETGAB',   nombre:'Golondrinas 69',      direccion:'CDMX'},
  {id:'CC023',empresaId:'ZIBACASAS',nombre:'Zintara',             direccion:'Grijalva 53, Querétaro'},
  {id:'CC024',empresaId:'ZIBACASAS',nombre:'Zircon',              direccion:'Querétaro'},
  {id:'CC025',empresaId:'ZIBACASAS',nombre:'Monte Denali',        direccion:'Querétaro'},
  {id:'CC026',empresaId:'ZIBACASAS',nombre:'Monte Himalaya',      direccion:'Querétaro'},
  {id:'CC027',empresaId:'REM',      nombre:'Res. Eduardo Molina', direccion:'Eduardo Molina 8132'},
  {id:'CC028',empresaId:'ADW',      nombre:'Sabino Park',         direccion:'Sabino 530'},
  {id:'CC029',empresaId:'SOFITER',  nombre:'LIV Reforma',         direccion:'Insurgentes 73'},
];

const INSUMOS_DEFAULT = [
  {id:'INS001',clave:'MAT-001',nombre:'Cemento Portland 50kg',       unidad:'Bulto',      categoria:'Materiales'},
  {id:'INS002',clave:'MAT-002',nombre:'Varilla 3/8" corrugada',      unidad:'kg',         categoria:'Materiales'},
  {id:'INS003',clave:'MAT-003',nombre:'Block 15x20x40',              unidad:'Pieza',      categoria:'Materiales'},
  {id:'INS004',clave:'MAT-004',nombre:'Arena lavada',                unidad:'m³',         categoria:'Materiales'},
  {id:'INS005',clave:'MAT-005',nombre:'Grava 3/4"',                  unidad:'m³',         categoria:'Materiales'},
  {id:'INS006',clave:'EQP-001',nombre:'Mezcladora de concreto',      unidad:'Equipo',     categoria:'Equipo'},
  {id:'INS007',clave:'EQP-002',nombre:'Vibrador de concreto',        unidad:'Equipo',     categoria:'Equipo'},
  {id:'INS008',clave:'EQP-003',nombre:'Andamio metálico',            unidad:'Marco',      categoria:'Equipo'},
  {id:'INS009',clave:'HER-001',nombre:'Carretilla',                  unidad:'Pieza',      categoria:'Herramienta'},
  {id:'INS010',clave:'HER-002',nombre:'Pala cuadrada',               unidad:'Pieza',      categoria:'Herramienta'},
  {id:'INS011',clave:'HER-003',nombre:'Hilo de cuerda 500m',         unidad:'Rollo',      categoria:'Herramienta'},
  {id:'INS012',clave:'MAT-006',nombre:'Tubo PVC 4" sanitario',       unidad:'Tramo',      categoria:'Materiales'},
  {id:'INS013',clave:'MAT-007',nombre:'Cable THW-LS 12 AWG',         unidad:'m',          categoria:'Materiales'},
  {id:'INS014',clave:'MAT-008',nombre:'Pintura vinílica blanca',     unidad:'Cubeta 20L', categoria:'Materiales'},
  {id:'INS015',clave:'MAT-009',nombre:'Impermeabilizante acrílico',  unidad:'Cubeta 20L', categoria:'Materiales'},
];

// Base URL para las llamadas de API. Si se abre mediante file://, se conecta al servidor local en el puerto 8000
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:8000' : '';
