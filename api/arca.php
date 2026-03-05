<?php
/**
 * FORMA — ARCA Facturación Electrónica
 * Endpoint: /api/arca.php
 *
 * Acciones disponibles (POST JSON):
 * - test_conexion : verifica conectividad con WSAA
 * - emitir_factura : emite comprobante y retorna CAE
 *
 * Ambiente: HOMOLOGACION (cambiar ARCA_AMBIENTE para produccion)
 * Firma TRA via openssl_pkcs7_sign (PHP nativo, sin exec)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://forma.moradesign.com.ar');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── Configuracion ──────────────────────────────────────────
define('ARCA_CUIT', '27282502149');
define('ARCA_PV',   7);
define('ARCA_CERT', '/home/c2610699/arca/wallybot_3f85b71a325c1c4f.crt');
define('ARCA_KEY',  '/home/c2610699/arca/privada.key');

// AMBIENTE: 'homo' = homologacion | 'prod' = produccion
define('ARCA_AMBIENTE', 'homo');

if (ARCA_AMBIENTE === 'homo') {
          define('WSAA_URL', 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl');
          define('WSFE_URL', 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl');
} else {
          define('WSAA_URL', 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl');
          define('WSFE_URL', 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl');
}

define('TOKEN_CACHE', sys_get_temp_dir() . '/arca_token_' . ARCA_CUIT . '.json');

// ── Helpers ────────────────────────────────────────────────
function responder($ok, $data = [], $error = '') {
          echo json_encode(['ok' => $ok, 'data' => $data, 'error' => $error]);
          exit;
}

// ── Firmar TRA con openssl_pkcs7_sign (PHP nativo, sin exec) ──
function firmarTRA($tra) {
          $cert = file_get_contents(ARCA_CERT);
          $key  = file_get_contents(ARCA_KEY);
          if (!$cert || !$key) {
                        return ['error' => 'No se pudo leer certificado o clave privada'];
          }

    $tmpIn  = tempnam(sys_get_temp_dir(), 'tra_');
          $tmpOut = tempnam(sys_get_temp_dir(), 'cms_');
          file_put_contents($tmpIn, $tra);

    $ok = openssl_pkcs7_sign(
                  $tmpIn, $tmpOut,
                  $cert,
                  [$key, ''],
                  [],
                  PKCS7_BINARY | PKCS7_NOATTR
              );

    if (!$ok) {
                  @unlink($tmpIn); @unlink($tmpOut);
                  return ['error' => 'Error firmando TRA: ' . openssl_error_string()];
    }

    $signed = file_get_contents($tmpOut);
          @unlink($tmpIn); @unlink($tmpOut);

    // Extraer bloque base64 del SMIME (despues de los headers MIME)
    $cms = '';
          if (preg_match('/Content-Transfer-Encoding: base64\s+([A-Za-z0-9+\/=\s]+)/s', $signed, $m)) {
                        $cms = preg_replace('/[\r\n\s]/', '', $m[1]);
          }

    if (strlen($cms) < 100) {
                  return ['error' => 'No se pudo extraer CMS del TRA firmado. Signed len=' . strlen($signed)];
    }

    return ['cms' => $cms];
}

// ── WSAA: obtener / cachear Token ──────────────────────────
function obtenerToken() {
          if (file_exists(TOKEN_CACHE)) {
                        $cache = json_decode(file_get_contents(TOKEN_CACHE), true);
                        if ($cache && isset($cache['expira']) && time() < $cache['expira']) {
                                          return $cache;
                        }
          }

    $desde    = date('c', strtotime('-10 minutes'));
          $hasta    = date('c', strtotime('+10 hours'));
          $uniqueId = time();

    $tra = '<?xml version="1.0" encoding="UTF-8"?>
          <loginTicketRequest version="1.0">
            <header>
              <uniqueId>' . $uniqueId . '</uniqueId>
              <generationTime>' . $desde . '</generationTime>
              <expirationTime>' . $hasta . '</expirationTime>
            </header>
            <service>wsfe</service>
          </loginTicketRequest>';

    $firmado = firmarTRA($tra);
          if (isset($firmado['error'])) {
                        return ['error' => $firmado['error']];
          }

    try {
                  $client = new SoapClient(WSAA_URL, [
                                                       'stream_context'     => stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]),
                                                       'trace'              => true,
                                                       'exceptions'         => true,
                                                       'connection_timeout' => 30,
                                                   ]);

                  $result = $client->loginCms(['in0' => $firmado['cms']]);
                  $xml    = simplexml_load_string($result->loginCmsReturn);

                  $token = (string)$xml->credentials->token;
                  $sign  = (string)$xml->credentials->sign;

                  $cache = ['token' => $token, 'sign' => $sign, 'expira' => time() + (9 * 3600)];
                  file_put_contents(TOKEN_CACHE, json_encode($cache));
                  return $cache;

    } catch (Exception $e) {
                  return ['error' => 'WSAA error: ' . $e->getMessage()];
    }
}

// ── WSFE: emitir comprobante ───────────────────────────────
function emitirFactura($datos) {
          $auth = obtenerToken();
          if (isset($auth['error'])) {
                        return ['ok' => false, 'error' => $auth['error']];
          }

    $tipoComp = intval($datos['tipo_comp'] ?? 6);
          $pv       = ARCA_PV;
          $concepto = intval($datos['concepto'] ?? 2);
          $docTipo  = intval($datos['doc_tipo']  ?? 80);
          $docNro   = $datos['doc_nro'] ?? '0';
          $neto     = floatval($datos['importe_neto'] ?? 0);
          $iva21    = round($neto * 0.21, 2);
          $total    = round($neto + $iva21, 2);
          $fecha    = date('Ymd');

    if ($docTipo == 99) { $docNro = '0'; }

    try {
                  $client = new SoapClient(WSFE_URL, [
                                                       'stream_context'     => stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]),
                                                       'trace'              => true,
                                                       'exceptions'         => true,
                                                       'connection_timeout' => 30,
                                                   ]);

                  $ultNroResp = $client->FECompUltimoAutorizado([
                                                                            'Auth'     => ['Token' => $auth['token'], 'Sign' => $auth['sign'], 'Cuit' => ARCA_CUIT],
                                                                            'PtoVta'   => $pv,
                                                                            'CbteTipo' => $tipoComp,
                                                                        ]);
                  $ultNro  = intval($ultNroResp->FECompUltimoAutorizadoResult->CbteNro ?? 0);
                  $nroComp = $ultNro + 1;

                  $iva = [];
                  if ($tipoComp != 11) {
                                    $iva = [['Id' => 5, 'BaseImp' => $neto, 'Importe' => $iva21]];
                  } else {
                                    $total = $neto;
                  }

                  $feDetReq = [
                                    'Concepto'   => $concepto,
                                    'DocTipo'    => $docTipo,
                                    'DocNro'     => $docNro,
                                    'CbteDesde'  => $nroComp,
                                    'CbteHasta'  => $nroComp,
                                    'CbteFch'    => $fecha,
                                    'ImpTotal'   => $total,
                                    'ImpTotConc' => 0,
                                    'ImpNeto'    => $tipoComp != 11 ? $neto : $total,
                                    'ImpOpEx'    => 0,
                                    'ImpIVA'     => $tipoComp != 11 ? $iva21 : 0,
                                    'ImpTrib'    => 0,
                                    'MonId'      => 'PES',
                                    'MonCotiz'   => 1,
                                ];

                  if (!empty($iva)) {
                                    $feDetReq['Iva'] = ['AlicIva' => $iva];
                  }

                  if ($concepto >= 2) {
                                    $feDetReq['FchServDesde'] = $datos['fch_serv_desde'] ?? date('Ymd', strtotime('first day of this month'));
                                    $feDetReq['FchServHasta'] = $datos['fch_serv_hasta'] ?? date('Ymd', strtotime('last day of this month'));
                                    $feDetReq['FchVtoPago']   = $datos['fch_vto_pago']   ?? date('Ymd', strtotime('+30 days'));
                  }

                  $resp = $client->FECAESolicitar([
                                                              'Auth'     => ['Token' => $auth['token'], 'Sign' => $auth['sign'], 'Cuit' => ARCA_CUIT],
                                                              'FeCAEReq' => [
                                                                  'FeCabReq' => ['CantReg' => 1, 'PtoVta' => $pv, 'CbteTipo' => $tipoComp],
                                                                  'FeDetReq' => ['FECAEDetRequest' => $feDetReq],
                                                              ],
                                                          ]);

                  $det = $resp->FECAESolicitarResult->FeDetResp->FECAEDetResponse ?? null;
                  if (!$det) return ['ok' => false, 'error' => 'Respuesta vacía de ARCA'];

                  $resultado = (string)($det->Resultado ?? '');
                  $cae       = (string)($det->CAE ?? '');
                  $caeFch    = (string)($det->CAEFchVto ?? '');
                  $errores   = [];

                  if (isset($det->Observaciones->Obs)) {
                                    $obs = $det->Observaciones->Obs;
                                    if (!is_array($obs)) $obs = [$obs];
                                    foreach ($obs as $o) {
                                                          $errores[] = (string)$o->Code . ': ' . (string)$o->Msg;
                                    }
                  }

                  if ($resultado === 'A') {
                                    return [
                                                          'ok'        => true,
                                                          'cae'       => $cae,
                                                          'cae_vto'   => $caeFch,
                                                          'nro_comp'  => $nroComp,
                                                          'pv'        => $pv,
                                                          'tipo_comp' => $tipoComp,
                                                          'total'     => $total,
                                                          'ambiente'  => ARCA_AMBIENTE,
                                                      ];
                  } else {
                                    return ['ok' => false, 'error' => 'ARCA rechazó el comprobante', 'obs' => $errores, 'resultado' => $resultado];
                  }

    } catch (Exception $e) {
                  return ['ok' => false, 'error' => 'WSFE error: ' . $e->getMessage()];
    }
}

// ── Router ─────────────────────────────────────────────────
$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$accion = $input['accion'] ?? $_GET['accion'] ?? '';

switch ($accion) {

      case 'test_conexion':
              $auth = obtenerToken();
              if (isset($auth['error'])) {
                                responder(false, [], $auth['error']);
              }
              responder(true, [
                                    'mensaje'  => 'Conexión exitosa con ARCA',
                                    'ambiente' => ARCA_AMBIENTE,
                                    'token_ok' => !empty($auth['token']),
                                    'expira'   => date('Y-m-d H:i:s', $auth['expira']),
                                ]);
              break;

      case 'emitir_factura':
              $resultado = emitirFactura($input);
              responder($resultado['ok'], $resultado, $resultado['error'] ?? '');
              break;

      default:
              responder(false, [], 'Acción no reconocida: ' . $accion);
}
