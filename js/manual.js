/* ══════════════════════════════════════════════
   FORMA — Manual de Usuario
══════════════════════════════════════════════ */

function renderManual() {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `
    <div class="manual-wrapper" style="max-width:860px;margin:0 auto;padding:32px 24px;font-family:inherit;color:#1a1a1a;line-height:1.75;">

      <!-- Portada -->
      <div style="text-align:center;padding:48px 0 40px;border-bottom:2px solid #dde;margin-bottom:40px;">
        <div style="font-size:2.4rem;font-weight:800;letter-spacing:2px;color:#111;margin-bottom:8px;">FORMA</div>
        <div style="font-size:1.05rem;color:#444;margin-bottom:4px;">Sistema de Gestión Integral</div>
        <div style="font-size:1rem;font-weight:600;color:#111;margin:16px 0 4px;">Manual de Usuario</div>
        <div style="font-size:0.9rem;color:#555;margin-bottom:4px;">Moradesign</div>
        <div style="font-size:0.85rem;color:#666;">forma.moradesign.com.ar</div>
      </div>

      <!-- Sección 1 -->
      <div class="manual-section">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:12px;">1. ¿Qué es FORMA?</h2>
        <p>FORMA es el sistema de gestión interno de Moradesign. Centraliza en un solo lugar toda la información del equipo: clientes, proyectos, presupuestos, diseños, contabilidad y finanzas.</p>
        <p>Accedé desde cualquier navegador en: <strong style="color:#2952d9;">forma.moradesign.com.ar</strong></p>
        <div class="manual-tip">💡 FORMA funciona en cualquier dispositivo con navegador web: computadora, tablet o celular.</div>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:24px 0 10px;">Acceso al sistema</h3>
        <p><strong style="color:#222;">Iniciar sesión:</strong> En la pantalla inicial, ingresá tu email y contraseña y hacé clic en "Entrar".</p>
        <p><strong style="color:#222;">Registrarse / Solicitar acceso:</strong> Si no tenés cuenta, completá el formulario con tu nombre completo, email y contraseña (mínimo 6 caracteres) y hacé clic en "Solicitar acceso". Un administrador deberá aprobar tu ingreso.</p>
      </div>

      <!-- Sección 2 -->
      <div class="manual-section">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:12px;">2. Módulos del sistema</h2>
        <p>FORMA está organizado en módulos accesibles desde el menú lateral izquierdo:</p>

        <div class="manual-modulo">
          <div class="manual-modulo-header">📊 Dashboard</div>
          <p>Pantalla de inicio con resumen de actividad: proyectos activos, presupuestos pendientes, cobros del mes y accesos rápidos.</p>
          <p><strong>Fila superior (métricas principales):</strong> Contactos activos, Proyectos activos, Ppto. enviado, Saldo bancario, Por cobrar y Por pagar.</p>
          <p><strong>Fila inferior (flujo del mes):</strong> Ingresos este mes, Egresos este mes, Gastos registrados, Flujo neto mensual y Cobros realizados.</p>
          <p><strong>Tablas del Dashboard:</strong> Últimos presupuestos (N°, cliente, total y estado) y Proyectos activos (listado con estado actual).</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">👥 Leads</div>
          <p>Gestión de contactos y potenciales clientes. Permite hacer seguimiento del proceso comercial.</p>
          <p><strong>Vista principal:</strong> Los contactos se listan en una tabla. Filtros por categoría: Todos, Particular, Empresa, Profesional, Proveedores e Institución.</p>
          <p><strong>Crear un nuevo contacto:</strong> Hacé clic en "+ Nuevo Contacto". Datos de contacto, datos bancarios opcionales y notas.</p>
          <p><strong>Estados:</strong> Pendiente → Contactado → Visita Agendada → En seguimiento → Activo → Cerrado.</p>
          <p><strong>Importar contactos:</strong> El botón "Importar" permite cargar contactos masivamente desde un archivo .txt o .csv.</p>
          <p><strong>Registrar actividad:</strong> Tipo (Llamada, Reunión, Email, WhatsApp, Nota), fecha, nota y próxima acción.</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">💼 Ventas</div>
          <p>Pipeline de oportunidades comerciales. Visualiza el estado de cada negociación en formato Kanban o listado.</p>
          <p><strong>Métricas:</strong> Pipeline activo, Cerradas, Tasa de cierre (%) y Seguimientos de hoy.</p>
          <p><strong>Etapas:</strong> Prospecto → Contactado → Presentación enviada → Visita agendada → Relevamiento → Propuesta enviada → Cerrado ✓ / Perdido.</p>
          <p><strong>Nueva oportunidad:</strong> Etapa, nombre, empresa, contacto, teléfono/WhatsApp, email, valor estimado ($), próxima acción y notas.</p>
          <p><strong>Acciones rápidas:</strong> Abrir WhatsApp directo con el contacto, Transferir a Gestión (convierte la oportunidad en proyecto).</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">📁 Gestión</div>
          <p>Administración de proyectos activos del estudio.</p>
          <p><strong>Vista principal:</strong> Los proyectos se muestran en tarjetas con estado, área, nombre, cliente, categoría, tipo y fecha límite.</p>
          <p><strong>Crear un nuevo proyecto:</strong> Nombre, cliente, empresa, CUIT, teléfono, email, categoría del espacio, tipo de proyecto, área responsable, estado, fecha límite, brief y notas de relevamiento.</p>
          <p><strong>Estados:</strong> Relevamiento → Presupuestar ⚡ (genera presupuesto automáticamente) → En proceso → Completado → Cancelado 🗑️.</p>
          <p><strong>Archivos:</strong> Se pueden adjuntar archivos (PDF, JPG, PNG, DWG, DXF, XLS, DOC, etc.) hasta 50 MB. Se eliminan a los 60 días del servidor.</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">🎨 Diseño</div>
          <p>Solicitudes de trabajo para el equipo de diseño.</p>
          <p><strong>Nueva solicitud:</strong> Proyecto asociado, tipo de diseño (Logo, Branding, Planos, Renders 3D, Presentación, Señalética, Otro), prioridad, fecha de entrega, responsable, brief y entregables.</p>
          <p><strong>Estados:</strong> Pendiente → En proceso → Revisión → Completado.</p>
          <p><strong>Archivos:</strong> PDF, JPG, PNG, AI, PSD, DWG, SVG — máx. 50 MB. Los archivos del proyecto se copian automáticamente.</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">💰 Presupuestos</div>
          <p>Cotizador y seguimiento de presupuestos enviados a clientes.</p>
          <p><strong>Crear presupuesto:</strong> Proyecto, cliente, CUIT, fecha, tipo de factura (A, B o C), estado y descuento global (%). Tabla de ítems con descripción, costo unitario, margen %, cantidad — calcula automáticamente C+F+S, precio neto, IVA, IIBB, precio final y total.</p>
          <p><strong>Estructura de costos (automática):</strong> Costo productos, flete, seguro (0,9%), ganancia, IVA compras, subtotal neto, IVA ventas, IIBB, IVA a pagar ARCA, descuento y TOTAL FINAL.</p>
          <p><strong>Estados:</strong> Borrador → Enviado → Aprobado → Facturado.</p>
          <p><strong>Acciones:</strong> Vista cliente, Imprimir/PDF, Guardar, Cancelar, Eliminar.</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">📒 Contable</div>
          <p>Registro de cobros, pagos, gastos y empleados, organizado en cuatro bloques:</p>
          <p><strong>Bloque 1 — Ingresos:</strong> Presupuestos, facturas a clientes y recibos de cobro.</p>
          <p><strong>Bloque 2 — Egresos:</strong> Pagos y proveedores, facturas de proveedores, y gastos operativos (Salario, Alquiler, Servicios, Telefonía, Materiales, Proveedor, Impuestos, Bancario, Marketing, Otros).</p>
          <p><strong>Bloque 3 — Tesorería:</strong> Retenciones AFIP y gestión de cheques.</p>
          <p><strong>Bloque 4 — Análisis:</strong> Cuenta corriente clientes, Posición IVA/ARCA, Empleados y Liquidación de sueldos.</p>
          <p><strong>Herramientas:</strong> CSV, Backup, Importar (extracto bancario) y ARCA (declaración impositiva).</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">🏦 Financiero</div>
          <p>Análisis financiero que consolida información bancaria.</p>
          <p><strong>Métricas:</strong> Saldo ARS y USD, ingresos 30 días, por cobrar y proyección (saldo + por cobrar).</p>
          <p><strong>Flujo bancario:</strong> Ingresos y egresos últimos 60 días con flujo neto.</p>
          <p><strong>Importar extracto bancario:</strong> Subir PDF del Banco Macro o pegar el texto del homebanking. Seleccioná la cuenta (CC USD, CC ARS, CA ARS) y hacé clic en "Importar movimientos".</p>
        </div>

        <div class="manual-modulo">
          <div class="manual-modulo-header">📞 Agente de Ventas</div>
          <p>Herramienta de prospección y seguimiento de llamadas comerciales. Cada usuario tiene su historial privado.</p>
          <p><strong>Métricas (últimos 30 días):</strong> Llamadas realizadas, contactadas, con interés, visitas agendadas y tasa de conversión.</p>
          <p><strong>Registrar una llamada:</strong> Nombre del contacto, empresa/consultorio, rubro, resultado y notas.</p>
          <p><strong>Resultados posibles:</strong> Interesado, No interesado, Volver a llamar, Sin respuesta, Reunión agendada.</p>
          <p><strong>Crear lead desde llamada:</strong> Convertir un contacto interesante en Lead directamente desde el registro de llamada.</p>
        </div>
      </div>

      <!-- Sección 3 -->
      <div class="manual-section">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:12px;">3. Uso básico</h2>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:20px 0 10px;">3.1 Flujo de trabajo</h3>
        <ol style="margin:10px 0 10px 20px;line-height:2;color:#333;">
          <li>Un cliente contacta el estudio → se carga como <strong>Lead</strong>.</li>
          <li>Si hay interés → se convierte en <strong>Oportunidad</strong> en Ventas.</li>
          <li>Al cerrar el trabajo → se crea el <strong>Proyecto</strong> en Gestión.</li>
          <li>Se genera el <strong>Presupuesto</strong> y se envía al cliente.</li>
          <li>Al aprobarse → el proyecto pasa a <strong>Diseño</strong>.</li>
          <li>Al finalizar → se registra el cobro en <strong>Contable</strong>.</li>
        </ol>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:20px 0 10px;">3.2 Presupuesto — Cotizador</h3>
        <p>El cotizador calcula automáticamente el precio final a partir de: precio de costo unitario, porcentaje de IVA, porcentaje de flete o gastos adicionales, margen de ganancia deseado y descuento global del presupuesto.</p>
        <div class="manual-tip">💡 El botón 'Guardar cambios' graba todos los tabs al mismo tiempo: datos del cliente, cotizador y pagos.</div>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:20px 0 10px;">3.3 Archivos adjuntos</h3>
        <p>Podés adjuntar archivos en <strong>Gestión</strong> (planos, referencias, contratos) y en <strong>Diseño</strong> (los archivos del proyecto se copian automáticamente).</p>
        <div class="manual-tip">💡 Los archivos se guardan en la base de datos. Podés descargarlos desde el botón 'Descargar'.</div>
      </div>

      <!-- Sección 4 -->
      <div class="manual-section">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:16px;">4. Roles y permisos</h2>
        <p>FORMA tiene tres niveles de acceso:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <thead>
            <tr style="background:#f0f0f5;border-bottom:2px solid #ccd;">
              <th style="padding:10px 14px;text-align:left;color:#111;font-weight:600;">Rol</th>
              <th style="padding:10px 14px;text-align:left;color:#111;font-weight:600;">Acceso</th>
              <th style="padding:10px 14px;text-align:left;color:#111;font-weight:600;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #dde;">
              <td style="padding:10px 14px;color:#2952d9;font-weight:600;">Admin</td>
              <td style="padding:10px 14px;color:#333;">Total</td>
              <td style="padding:10px 14px;color:#333;">Acceso a todos los módulos. Puede crear y gestionar usuarios.</td>
            </tr>
            <tr style="border-bottom:1px solid #dde;">
              <td style="padding:10px 14px;color:#1a7a4a;font-weight:600;">Operador</td>
              <td style="padding:10px 14px;color:#333;">Completo</td>
              <td style="padding:10px 14px;color:#333;">Puede crear, editar y eliminar registros en todos los módulos.</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#b55800;font-weight:600;">Visor</td>
              <td style="padding:10px 14px;color:#333;">Lectura</td>
              <td style="padding:10px 14px;color:#333;">Solo puede ver la información, sin modificar nada.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sección 5 -->
      <div class="manual-section">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:12px;">5. Consejos y buenas prácticas</h2>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:0 0 12px;">Flujo de trabajo típico</h3>
        <ol style="margin:0 0 20px 20px;line-height:2.1;color:#333;">
          <li>Cargar el contacto en <strong>Leads</strong> con sus datos y origen.</li>
          <li>Crear una oportunidad en <strong>Ventas</strong> y avanzarla por el pipeline.</li>
          <li>Al concretar la visita, crear un <strong>Proyecto</strong> en Gestión con los datos del relevamiento.</li>
          <li>Cambiar el estado a "Presupuestar" para generar automáticamente un presupuesto.</li>
          <li>Completar y enviar el <strong>Presupuesto</strong> al cliente.</li>
          <li>Una vez aprobado, registrar cobros y pagos en <strong>Contable</strong>.</li>
          <li>Hacer seguimiento financiero desde <strong>Análisis Financiero</strong> y el Dashboard.</li>
          <li>Si el proyecto requiere trabajo gráfico, crear una <strong>Solicitud de Diseño</strong>.</li>
        </ol>

        <h3 style="font-size:1.05rem;font-weight:600;color:#222;margin:0 0 12px;">Consideraciones importantes</h3>
        <ul style="margin:0 0 10px 20px;line-height:2.1;color:#333;">
          <li>Los archivos adjuntos se eliminan automáticamente a los <strong>60 días</strong> del servidor. Descargá y guardá los archivos importantes localmente.</li>
          <li><strong>Cancelar</strong> un proyecto lo elimina definitivamente. <strong>Completado</strong> lo mueve al archivo.</li>
          <li>La exportación <strong>ARCA.txt</strong> facilita la declaración de IVA ante la AFIP.</li>
          <li>El módulo de <strong>Agente de Ventas</strong> es independiente del Pipeline de Ventas y está orientado a prospección telefónica masiva.</li>
          <li>Cada usuario puede tener acceso restringido a módulos específicos según su rol.</li>
        </ul>
      </div>

      <!-- Sección 6 -->
      <div class="manual-section" style="border-bottom:none;padding-bottom:0;">
        <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:10px;">6. Soporte</h2>
        <p>Ante cualquier problema técnico o consulta sobre el sistema, contactar al administrador del equipo.</p>
      </div>

    </div>

    <style>
      .manual-wrapper h2 { border-left: 3px solid #2952d9; padding-left: 12px; }
      .manual-section { padding: 28px 0; border-bottom: 1px solid #dde; }
      .manual-modulo { background: #f7f7fc; border: 1px solid #dde; border-radius: 8px; padding: 18px 20px; margin: 16px 0; }
      .manual-modulo-header { font-size: 1.05rem; font-weight: 700; color: #111; margin-bottom: 10px; }
      .manual-tip { background: #f0faf0; border-left: 3px solid #2e7d32; padding: 10px 16px; border-radius: 4px; margin: 12px 0; color: #1b5e20; font-size: 0.92rem; }
      .manual-wrapper p { margin: 8px 0; color: #333; }
      .manual-wrapper li { color: #333; }
      .manual-wrapper strong { color: #111; }
    </style>
  `;
}
