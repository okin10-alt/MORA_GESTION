// FORMA — módulo: arca (Facturación Electrónica ARCA/AFIP)
// Requiere: api.js (apiPost), app.js (título, actions, c, cerrar, DB, guardar, uid, hoy, pesos)

// ── Estado local ──────────────────────────────────────────
let _arcaFacturas = [];   // historial local de facturas emitidas (guardadas en DB)

// ── Entrada al módulo ─────────────────────────────────────
function facturacion() {
    titulo('Facturación Electrónica');
    actions(`
        <button class="btn btn-primary" onclick="arcaNuevaFactura()">
              <i class="fa fa-file-invoice"></i> Nueva Factura
                  </button>
                      <button class="btn btn-secondary" onclick="arcaTestConexion()" style="margin-left:6px">
                            <i class="fa fa-plug"></i> Test ARCA
                                </button>
                                  `);
    _arcaFacturas = DB.arcaFacturas || [];
    arcaRenderLista();
}

// ── Render lista ──────────────────────────────────────────
function arcaRenderLista() {
    const lista = _arcaFacturas.slice().reverse();
    const html = lista.length === 0
      ? `<div class="empty-state" style="padding:60px;text-align:center;color:#aaa;">
               <i class="fa fa-file-invoice" style="font-size:3em;margin-bottom:12px;display:block"></i>
                        No hay facturas emitidas aún.
                               </div>`
          : `<div class="tabla-wrapper">
                  <table class="tabla">
                            <thead>
                                        <tr>
                                                      <th>Fecha</th><th>Tipo</th><th>N°</th><th>Cliente</th>
                                                                    <th>CUIT/DNI</th><th>Total</th><th>CAE</th><th>Vto CAE</th>
                                                                                </tr>
                                                                                          </thead>
                                                                                                    <tbody>
                                                                                                                ${lista.map(f => `
                                                                                                                              <tr>
                                                                                                                                              <td>${f.fecha}</td>
                                                                                                                                                              <td>${arcaTipoLabel(f.tipo_comp)}</td>
                                                                                                                                                                              <td>${f.pv ? String(f.pv).padStart(4,'0') : ''}-${f.nro_comp ? String(f.nro_comp).padStart(8,'0') : ''}</td>
                                                                                                                                                                                              <td>${f.cliente || ''}</td>
                                                                                                                                                                                                              <td>${f.doc_nro || ''}</td>
                                                                                                                                                                                                                              <td>${pesos(f.total || 0)}</td>
                                                                                                                                                                                                                                              <td style="font-size:0.85em">${f.cae || '<span style=color:red>PENDIENTE</span>'}</td>
                                                                                                                                                                                                                                                              <td>${f.cae_vto || ''}</td>
                                                                                                                                                                                                                                                                            </tr>`).join('')}
                                                                                                                                                                                                                                                                                      </tbody>
                                                                                                                                                                                                                                                                                              </table>
                                                                                                                                                                                                                                                                                                    </div>`;
    c('content').innerHTML = html;
}

// ── Helper: etiqueta tipo comprobante ─────────────────────
function arcaTipoLabel(tipo) {
    const tipos = {1:'FC-A', 6:'FC-B', 11:'FC-C', 51:'FC-M'};
    return tipos[tipo] || ('Tipo '+tipo);
}

// ── Test conexión ARCA ────────────────────────────────────
async function arcaTestConexion() {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Probando...';
    try {
          const res = await apiPost('arca.php', { accion: 'test_conexion' });
          if (res.ok) {
                  alert('✅ ARCA conectado OK\nAmbiente: ' + res.data.ambiente + '\nToken expira: ' + res.data.expira);
          } else {
                  alert('❌ Error ARCA: ' + res.error);
          }
    } catch(e) {
          alert('❌ Error de red: ' + e.message);
    } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa fa-plug"></i> Test ARCA';
    }
}

// ── Modal nueva factura ───────────────────────────────────
function arcaNuevaFactura(prefill) {
    prefill = prefill || {};
    const hoyDate = hoy();
    abrir('modal-arca-factura', `
        <div class="modal-header"><h3>Nueva Factura Electrónica</h3></div>
            <div class="modal-body">
                  <div class="form-row">
                          <div class="form-group col-6">
                                    <label>Tipo de Comprobante</label>
                                              <select id="arc-tipo" class="form-control">
                                                          <option value="6" ${prefill.tipo==6?'selected':''}>Factura B</option>
                                                                      <option value="1" ${prefill.tipo==1?'selected':''}>Factura A</option>
                                                                                  <option value="11" ${prefill.tipo==11?'selected':''}>Factura C</option>
                                                                                            </select>
                                                                                                    </div>
                                                                                                            <div class="form-group col-6">
                                                                                                                      <label>Concepto</label>
                                                                                                                                <select id="arc-concepto" class="form-control">
                                                                                                                                            <option value="1">Productos</option>
                                                                                                                                                        <option value="2" selected>Servicios</option>
                                                                                                                                                                    <option value="3">Productos y Servicios</option>
                                                                                                                                                                              </select>
                                                                                                                                                                                      </div>
                                                                                                                                                                                            </div>
                                                                                                                                                                                                  <div class="form-row">
                                                                                                                                                                                                          <div class="form-group col-6">
                                                                                                                                                                                                                    <label>Tipo Documento Cliente</label>
                                                                                                                                                                                                                              <select id="arc-docTipo" class="form-control" onchange="arcaToggleDocNro(this.value)">
                                                                                                                                                                                                                                          <option value="80">CUIT</option>
                                                                                                                                                                                                                                                      <option value="96">DNI</option>
                                                                                                                                                                                                                                                                  <option value="99">Consumidor Final</option>
                                                                                                                                                                                                                                                                            </select>
                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                            <div class="form-group col-6" id="arc-docNro-wrap">
                                                                                                                                                                                                                                                                                                      <label>Nro Documento</label>
                                                                                                                                                                                                                                                                                                                <input id="arc-docNro" class="form-control" placeholder="Ej: 20123456789" value="${prefill.doc_nro||''}">
                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                    <div class="form-row">
                                                                                                                                                                                                                                                                                                                                            <div class="form-group col-6">
                                                                                                                                                                                                                                                                                                                                                      <label>Nombre / Razón Social</label>
                                                                                                                                                                                                                                                                                                                                                                <input id="arc-cliente" class="form-control" placeholder="Nombre del cliente" value="${prefill.cliente||''}">
                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                <div class="form-group col-6">
                                                                                                                                                                                                                                                                                                                                                                                          <label>Importe Neto (sin IVA)</label>
                                                                                                                                                                                                                                                                                                                                                                                                    <input id="arc-neto" class="form-control" type="number" step="0.01" placeholder="0.00" value="${prefill.importe_neto||''}">
                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                                                                        <div id="arc-fechas-serv" class="form-row">
                                                                                                                                                                                                                                                                                                                                                                                                                                <div class="form-group col-4">
                                                                                                                                                                                                                                                                                                                                                                                                                                          <label>Servicio Desde</label>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <input id="arc-fchDesde" class="form-control" type="date" value="${hoyDate}">
                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div class="form-group col-4">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <label>Servicio Hasta</label>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <input id="arc-fchHasta" class="form-control" type="date" value="${hoyDate}">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <div class="form-group col-4">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <label>Vto Pago</label>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <input id="arc-fchVto" class="form-control" type="date" value="${hoyDate}">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div id="arc-resumen" style="background:#f8f9fa;border-radius:8px;padding:12px;margin-top:8px;display:none">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <strong>Resumen:</strong>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                Neto: <span id="arc-r-neto">-</span> |
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        IVA 21%: <span id="arc-r-iva">-</span> |
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <strong>Total: <span id="arc-r-total">-</span></strong>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <div class="modal-footer">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <button class="btn btn-secondary" onclick="cerrar('modal-arca-factura')">Cancelar</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <button class="btn btn-primary" id="arc-btn-emitir" onclick="arcaEmitir()">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <i class="fa fa-paper-plane"></i> Emitir Factura
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `);

  // Calcular resumen al cambiar neto
  document.getElementById('arc-neto').addEventListener('input', arcaActualizarResumen);
    document.getElementById('arc-tipo').addEventListener('change', arcaActualizarResumen);
    arcaActualizarResumen();
}

function arcaToggleDocNro(val) {
    document.getElementById('arc-docNro-wrap').style.display = val === '99' ? 'none' : '';
}

function arcaActualizarResumen() {
    const tipo = parseInt(document.getElementById('arc-tipo')?.value || 6);
    const neto = parseFloat(document.getElementById('arc-neto')?.value || 0);
    if (!neto) { document.getElementById('arc-resumen').style.display='none'; return; }
    const iva = tipo !== 11 ? Math.round(neto * 0.21 * 100) / 100 : 0;
    const total = neto + iva;
    document.getElementById('arc-r-neto').textContent  = pesos(neto);
    document.getElementById('arc-r-iva').textContent   = pesos(iva);
    document.getElementById('arc-r-total').textContent = pesos(total);
    document.getElementById('arc-resumen').style.display = '';
}

// ── Emitir factura ────────────────────────────────────────
async function arcaEmitir() {
    const btn = document.getElementById('arc-btn-emitir');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Emitiendo...';

  const tipo    = parseInt(document.getElementById('arc-tipo').value);
    const concepto= parseInt(document.getElementById('arc-concepto').value);
    const docTipo = parseInt(document.getElementById('arc-docTipo').value);
    const docNro  = document.getElementById('arc-docNro')?.value?.trim() || '0';
    const cliente = document.getElementById('arc-cliente').value.trim();
    const neto    = parseFloat(document.getElementById('arc-neto').value);
    const fchDesde= (document.getElementById('arc-fchDesde')?.value || hoy()).replace(/-/g,'');
    const fchHasta= (document.getElementById('arc-fchHasta')?.value || hoy()).replace(/-/g,'');
    const fchVto  = (document.getElementById('arc-fchVto')?.value  || hoy()).replace(/-/g,'');

  if (!neto || neto <= 0) {
        alert('Ingresá un importe neto válido.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-paper-plane"></i> Emitir Factura';
        return;
  }

  try {
        const payload = {
                accion: 'emitir_factura',
                tipo_comp: tipo,
                concepto,
                doc_tipo: docTipo,
                doc_nro: docNro,
                importe_neto: neto,
                fch_serv_desde: fchDesde,
                fch_serv_hasta: fchHasta,
                fch_vto_pago: fchVto,
        };

      const res = await apiPost('arca.php', payload);

      if (res.ok && res.data?.cae) {
              // Guardar en historial local
          const factura = {
                    id: uid(),
                    fecha: hoy(),
                    tipo_comp: tipo,
                    pv: res.data.pv,
                    nro_comp: res.data.nro_comp,
                    cliente,
                    doc_tipo: docTipo,
                    doc_nro: docNro,
                    importe_neto: neto,
                    total: res.data.total,
                    cae: res.data.cae,
                    cae_vto: res.data.cae_vto,
                    ambiente: res.data.ambiente,
          };
              if (!DB.arcaFacturas) DB.arcaFacturas = [];
              DB.arcaFacturas.push(factura);
              guardar();
              _arcaFacturas = DB.arcaFacturas;

          cerrar('modal-arca-factura');
              arcaRenderLista();

          // Mostrar resumen
          setTimeout(() => {
                    alert(
                                '✅ Factura emitida con éxito!\n\n' +
                                'N°: ' + String(res.data.pv).padStart(4,'0') + '-' + String(res.data.nro_comp).padStart(8,'0') + '\n' +
                                'CAE: ' + res.data.cae + '\n' +
                                'Vto CAE: ' + res.data.cae_vto + '\n' +
                                'Total: ' + pesos(res.data.total)
                              );
          }, 100);
      } else {
              const errMsg = res.error || (res.data?.error) || 'Error desconocido';
              const obs = res.data?.obs ? '\n' + res.data.obs.join('\n') : '';
              alert('❌ Error al emitir: ' + errMsg + obs);
              btn.disabled = false;
              btn.innerHTML = '<i class="fa fa-paper-plane"></i> Emitir Factura';
      }
  } catch(e) {
        alert('❌ Error de red: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-paper-plane"></i> Emitir Factura';
  }
}

// ── Atajo: emitir factura desde un presupuesto aprobado ───
function arcaFacturarPresupuesto(ppto) {
    arcaNuevaFactura({
          cliente:      ppto.cliente || '',
          doc_nro:      ppto.cuit || '',
          importe_neto: ppto.total || 0,
          tipo:         6,
    });
}
