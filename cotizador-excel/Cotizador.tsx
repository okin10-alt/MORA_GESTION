import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface ItemCotizacion {
  producto: string;
  compra: number;        // Precio unitario de compra (columna C)
  cantidad: number;      // Cantidad (columna V)
  // Porcentajes configurables
  ivaCompraPct: number;  // % IVA Compra (10.5% o 21%) - EDITABLE
  fletePct: number;      // % Flete (default 20%)
  seguroPct: number;     // % Seguro (default 0.9%)
  margenPct: number;     // % Margen (default 30%)
  ivaPct: number;        // % IVA (default 21%)
  // Calculados automáticamente - BLOQUES
  totalPNG: number;      // D: Total PNG (compra * cantidad)
  ivaCompra: number;     // E: IVA Compra
  flete: number;         // G: Flete
  seguro: number;        // I: Seguro
  ivaFlete: number;      // J: IVA Flete 21%
  totalFlete: number;    // K: Total Flete
  subTotal: number;      // L: Sub Total
  margen: number;        // N: Margen
  precioNeto: number;    // O: Precio Neto
  precioConIva: number;  // P: Precio con IVA
  ivaVenta: number;      // R: IVA Venta
  iibb: number;          // S: IIBB
  totalUnit: number;     // U: Total Unitario
  precioVenta: number;   // W: Precio de Venta
  // Columnas adicionales X-AH
  m3: number;            // X: m3 (fijo 0.42)
  m3x2780: number;       // Y: m3 * 2780
  segXVD: number;        // Z: seg xVD (compra * 0.8%)
  totalFleteConIva: number; // AA: (m3x2780 + segXVD) * 1.21
  totalUnitIB: number;   // AB: Total Unit * 1.03
  acCant: number;        // AC: Cantidad adicional (editable)
  total: number;         // AD: Total Unit+IB * acCant
  margenTotal: number;   // AE: Margen * cantidad
  costosGralesVD: number; // AF: Total Flete * cantidad
  costosGralesM3: number; // AG: totalFleteConIva * acCant
  costosGralCompra: number; // AH: (compra + IVA Venta) * cantidad
}

const IIBB_PCT = 0.035; // 3.5% fijo
const SEGVD_PCT = 0.008; // 0.8% fijo

export default function Cotizador() {
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [descuento, setDescuento] = useState(0.10); // 10% default

  // ============================================
  // FUNCIÓN DE CÁLCULO - FÓRMULAS EXACTAS DEL EXCEL
  // ============================================
  const calcularItem = (
    compra: number,
    cantidad: number,
    ivaCompraPct: number,
    fletePct: number,
    seguroPct: number,
    margenPct: number,
    ivaPct: number,
    producto: string = '',
    acCant: number = 1
  ): ItemCotizacion => {
    const C = compra;
    const V = cantidad;
    
    // D: TOTAL PNG = compra * cantidad
    const Dt = C * V;
    
    // E: IVA COMPRA = TOTAL PNG * ivaCompraPct
    const E = Dt * ivaCompraPct;
    
    // G: FLETE = TOTAL PNG * flete%
    const G = Dt * fletePct;
    
    // I: SEGURO = TOTAL PNG * seguro%
    const I = Dt * seguroPct;
    
    // J: IVA FLETE = (Flete + Seguro) * 21% (fijo)
    const J = (G + I) * 0.21;
    
    // K: TOTAL FLETE = Flete + Seguro + IVA Flete
    const K = G + I + J;
    
    // L: SUBTOTAL = TOTAL PNG
    const L = Dt;
    
    // N: MARGEN = Subtotal * margen%
    const N = L * margenPct;
    
    // O: PRECIO NETO = Subtotal + Margen
    const O = L + N;
    
    // S: IIBB = Precio Neto * 3.5% (fijo)
    const S = O * IIBB_PCT;
    
    // R: IVA VENTA = (Precio Neto + IIBB + Total Flete) * IVA%
    const R = (O + S + K) * ivaPct;
    
    // P: PRECIO CON IVA = Precio Neto + IVA Venta + IIBB
    const P = O + R + S;
    
    // U: TOTAL UNIT = (P + S + K) / cantidad
    const U = V > 0 ? (P + S + K) / V : 0;
    
    // W: PRECIO DE VENTA = Total Unit * cantidad
    const W = U * V;

    // Columnas adicionales X-AH
    const X = 0.42; // m3 (fijo 0.42)
    const Y = X * 2780; // m3 * 2780
    const Z = C * SEGVD_PCT; // seg xVD (compra * 0.8%)
    const AA = (Y + Z) * 1.21; // (m3x2780 + segXVD) * 1.21
    const AB = U * 1.03; // Total Unit * 1.03
    const AC = acCant; // Cantidad adicional (editable - pasada como parámetro)
    const AD = AB * AC; // Total Unit+IB * acCant
    const AE = N * V; // Margen * cantidad
    const AF = K * V; // Total Flete * cantidad
    const AG = AA * AC; // totalFleteConIva * acCant
    const AH = (C + R) * V; // (compra + IVA Venta) * cantidad

    return {
      producto,
      compra: C,
      cantidad: V,
      ivaCompraPct,
      fletePct,
      seguroPct,
      margenPct,
      ivaPct,
      totalPNG: Dt,
      ivaCompra: E,
      flete: G,
      seguro: I,
      ivaFlete: J,
      totalFlete: K,
      subTotal: L,
      margen: N,
      precioNeto: O,
      precioConIva: P,
      ivaVenta: R,
      iibb: S,
      totalUnit: U,
      precioVenta: W,
      m3: X,
      m3x2780: Y,
      segXVD: Z,
      totalFleteConIva: AA,
      totalUnitIB: AB,
      acCant: AC,
      total: AD,
      margenTotal: AE,
      costosGralesVD: AF,
      costosGralesM3: AG,
      costosGralCompra: AH
    };
  };

  const agregarItem = () => {
    // Valores por defecto del Excel: Flete 20%, Seguro 0.9%, Margen 30%, IVA 21%
    const nuevoItem = calcularItem(0, 1, 0.21, 0.20, 0.009, 0.30, 0.21, '', 1);
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const actualizarItem = (index: number, field: keyof ItemCotizacion, value: any) => {
    const nuevosItems = [...items];
    const itemActual = nuevosItems[index];
    
    // Actualizar el campo
    nuevosItems[index] = { ...itemActual, [field]: value };
    
    // Si el campo afecta cálculos, recalcular todo el item
    if (['compra', 'cantidad', 'ivaCompraPct', 'fletePct', 'seguroPct', 'margenPct', 'ivaPct', 'acCant'].includes(field)) {
      const itemRecalculado = calcularItem(
        field === 'compra' ? value : itemActual.compra,
        field === 'cantidad' ? value : itemActual.cantidad,
        field === 'ivaCompraPct' ? value : itemActual.ivaCompraPct,
        field === 'fletePct' ? value : itemActual.fletePct,
        field === 'seguroPct' ? value : itemActual.seguroPct,
        field === 'margenPct' ? value : itemActual.margenPct,
        field === 'ivaPct' ? value : itemActual.ivaPct,
        itemActual.producto,
        field === 'acCant' ? value : itemActual.acCant
      );
      nuevosItems[index] = itemRecalculado;
    }
    
    setItems(nuevosItems);
  };

  const pesos = (val: number) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      minimumFractionDigits: 2 
    }).format(val);
  };

  const porcentaje = (val: number) => {
    return (val * 100).toFixed(1) + '%';
  };

  // Calcular totales generales
  const sumas = {
    totalCompra: items.reduce((sum, item) => sum + item.compra, 0),
    totalPNG: items.reduce((sum, item) => sum + item.totalPNG, 0),
    totalIvaCompra: items.reduce((sum, item) => sum + item.ivaCompra, 0),
    totalIvaFlete: items.reduce((sum, item) => sum + item.ivaFlete, 0),
    totalFlete: items.reduce((sum, item) => sum + item.totalFlete, 0),
    totalSubTotal: items.reduce((sum, item) => sum + item.subTotal, 0),
    totalMargen: items.reduce((sum, item) => sum + item.margen, 0),
    totalPrecioNeto: items.reduce((sum, item) => sum + item.precioNeto, 0),
    totalPrecioConIva: items.reduce((sum, item) => sum + item.precioConIva, 0),
    totalIvaVenta: items.reduce((sum, item) => sum + item.ivaVenta, 0),
    totalIibb: items.reduce((sum, item) => sum + item.iibb, 0),
    totalPrecioVenta: items.reduce((sum, item) => sum + item.precioVenta, 0),
  };

  // Totales con descuento
  const W32 = sumas.totalPrecioVenta;
  const S31 = W32 * IIBB_PCT;
  const W33 = W32 * descuento;
  const W34 = W32 - W33; // Con descuento

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MODELO FACTURA B</h1>
        <p className="text-gray-600">C.U.I.T 30-00000000-0 | Fecha: {new Date().toLocaleDateString('es-AR')}</p>
      </div>

      {/* Botón Agregar */}
      <div className="mb-6">
        <button
          onClick={agregarItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Agregar Item
        </button>
      </div>

      {/* Tabla de Items */}
      <div className="overflow-x-auto border border-gray-900 rounded-lg shadow-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* ROW 1: Títulos principales */}
            <tr className="bg-yellow-100">
              <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>ITEMS</th>
              <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>Producto</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" colSpan={3}>COMPRA</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" colSpan={6}>FLETE</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200 font-bold" rowSpan={3}>Sub Total</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" colSpan={2}>UTILIDAD</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" colSpan={2}>VENTA</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" colSpan={2}>IVA</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200" rowSpan={3}>IIBB</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>Total Unit</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>Cantidad</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>Precio de Venta</th>
              {/* COLUMNAS ADICIONALES X-AH */}
              <th className="border border-black px-2 py-2 text-center bg-blue-200 font-bold" rowSpan={3}>m3</th>
              <th className="border border-black px-2 py-2 text-center bg-blue-200 font-bold" rowSpan={3}>m3x2780</th>
              <th className="border border-black px-2 py-2 text-center bg-blue-200 font-bold" colSpan={1}>seg xVD</th>
              <th className="border border-black px-2 py-2 text-center bg-red-500 text-white font-bold" rowSpan={3}>total flete con iva</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>total Unit+IB</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>cantidad</th>
              <th className="border border-black px-2 py-2 text-center bg-yellow-100 font-bold" rowSpan={3}>total</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200 font-bold" rowSpan={3}>margen total</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200 font-bold" rowSpan={3}>costos grales vd</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200 font-bold" rowSpan={3}>costos grales m3</th>
              <th className="border border-black px-2 py-2 text-center bg-orange-200 font-bold" rowSpan={3}>costos gral compra</th>
              <th className="border border-black px-2 py-2 text-center" rowSpan={3}>Acciones</th>
            </tr>
            {/* ROW 2: Subtítulos */}
            <tr className="bg-orange-200">
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}></td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>TOTAL PNG</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>IVA %</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Flete %</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Flete</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Seguro %</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>seguro</td>
              <td className="border border-black px-2 py-1 text-center font-semibold">IVA</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Total flete</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Margen %</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>Margen</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" colSpan={2}>PRECIO NETO</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>IVA %</td>
              <td className="border border-black px-2 py-1 text-center font-semibold" rowSpan={2}>VTAS</td>
              {/* Columna adicional header row 2 */}
              <td className="border border-black px-2 py-1 text-center bg-blue-200">0,8%</td>
            </tr>
            {/* ROW 3: Detalles finales */}
            <tr className="bg-orange-200">
              <td className="border border-black px-2 py-1 text-center font-semibold">21%</td>
              <td className="border border-black px-2 py-1 text-center font-semibold">FACT A</td>
              <td className="border border-black px-2 py-1 text-center font-semibold">FACT B</td>
              {/* Columna adicional header row 3 */}
              <td className="border border-black px-2 py-1 text-center bg-blue-200"></td>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={34} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No hay items. Haz clic en "Agregar Item" para comenzar.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-2">
                    <input
                      type="text"
                      value={item.producto}
                      onChange={(e) => actualizarItem(index, 'producto', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Descripción producto..."
                    />
                  </td>
                  
                  {/* COMPRA */}
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.compra}
                      onChange={(e) => actualizarItem(index, 'compra', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                      placeholder="$ Compra"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.totalPNG)}</td>
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.ivaCompraPct * 100}
                      onChange={(e) => actualizarItem(index, 'ivaCompraPct', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                    />
                  </td>
                  
                  {/* FLETE */}
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.fletePct * 100}
                      onChange={(e) => actualizarItem(index, 'fletePct', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.flete)}</td>
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.seguroPct * 100}
                      onChange={(e) => actualizarItem(index, 'seguroPct', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.seguro)}</td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.ivaFlete)}</td>
                  <td className="border border-black px-2 py-2 text-right font-semibold">{pesos(item.totalFlete)}</td>
                  
                  {/* SUBTOTAL */}
                  <td className="border border-black px-2 py-2 text-right bg-yellow-50 font-semibold">{pesos(item.subTotal)}</td>
                  
                  {/* UTILIDAD */}
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.margenPct * 100}
                      onChange={(e) => actualizarItem(index, 'margenPct', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.margen)}</td>
                  
                  {/* VENTA */}
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.precioNeto)}</td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.precioConIva)}</td>
                  
                  {/* IVA */}
                  <td className="border border-black px-2 py-2 bg-green-50">
                    <input
                      type="number"
                      value={item.ivaPct * 100}
                      onChange={(e) => actualizarItem(index, 'ivaPct', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.ivaVenta)}</td>
                  
                  {/* IIBB */}
                  <td className="border border-black px-2 py-2 text-right">{pesos(item.iibb)}</td>
                  
                  {/* TOTALES */}
                  <td className="border border-black px-2 py-2 text-right bg-yellow-100 font-bold">{pesos(item.totalUnit)}</td>
                  <td className="border border-black px-2 py-2 bg-yellow-100">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => actualizarItem(index, 'cantidad', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      min="1"
                      step="1"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right bg-yellow-100 font-bold text-lg">{pesos(item.precioVenta)}</td>
                  {/* COLUMNAS ADICIONALES X-AH */}
                  <td className="border border-black px-2 py-2 text-right bg-blue-200 font-bold">{item.m3.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-blue-200 font-bold">{item.m3x2780.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-blue-200 font-bold">{item.segXVD.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-red-500 text-white font-bold">{item.totalFleteConIva.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-yellow-100 font-bold">{item.totalUnitIB.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 bg-yellow-100">
                    <input
                      type="number"
                      value={item.acCant}
                      onChange={(e) => actualizarItem(index, 'acCant', parseFloat(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="border border-black px-2 py-2 text-right bg-yellow-100 font-bold">{item.total.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-orange-200 font-bold">{item.margenTotal.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-orange-200 font-bold">{item.costosGralesVD.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-orange-200 font-bold">{item.costosGralesM3.toFixed(2)}</td>
                  <td className="border border-black px-2 py-2 text-right bg-orange-200 font-bold">{item.costosGralCompra.toFixed(2)}</td>
                  
                  <td className="border border-black px-3 py-2 text-center">
                    <button
                      onClick={() => eliminarItem(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            
            {/* Fila de TOTALES */}
            {items.length > 0 && (
              <tr className="bg-gray-800 text-white font-bold">
                <td className="border border-black px-3 py-3" colSpan={2}>TOTALES</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalCompra)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalPNG)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalIvaCompra)}</td>
                <td className="border border-black px-2 py-3 text-right" colSpan={2}></td>
                <td className="border border-black px-2 py-3 text-right" colSpan={2}></td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalIvaFlete)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalFlete)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalSubTotal)}</td>
                <td className="border border-black px-2 py-3 text-right" colSpan={1}></td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalMargen)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalPrecioNeto)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalPrecioNeto)}</td>
                <td className="border border-black px-2 py-3 text-right" colSpan={1}></td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalIvaVenta)}</td>
                <td className="border border-black px-2 py-3 text-right">{pesos(sumas.totalIibb)}</td>
                <td className="border border-black px-2 py-3 text-right" colSpan={2}></td>
                <td className="border border-black px-2 py-3 text-right text-xl">{pesos(sumas.totalPrecioVenta)}</td>
                <td className="border border-black px-3 py-3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totales finales con descuento */}
      {items.length > 0 && (
        <div className="mt-6 flex justify-end">
          <div className="w-96 border border-gray-900 rounded-lg p-4 bg-white shadow-lg">
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="font-bold">Importe Total:</span>
              <span className="font-bold text-lg bg-orange-200 px-3 py-1 rounded">{pesos(W32)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="font-bold">DESCUENTO:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(descuento * 100).toFixed(0)}
                  onChange={(e) => setDescuento((parseFloat(e.target.value) || 0) / 100)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                  min="0"
                  max="100"
                  step="1"
                />
                <span>%</span>
                <span className="ml-2">{pesos(W33)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-bold text-lg">Con Descuento:</span>
              <span className="font-bold text-2xl text-green-700">{pesos(W34)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Explicación de fórmulas */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-300">
        <h3 className="text-lg font-bold mb-4">📐 Fórmulas de Cálculo (según Excel original)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-700">🛒 COMPRA</h4>
            <p className="text-gray-700">• Total PNG = compra × cantidad<br/>• IVA = Total PNG × 21%</p>
          </div>
          <div>
            <h4 className="font-semibold text-purple-700">🚚 FLETE</h4>
            <p className="text-gray-700">• Flete = Total PNG × flete%<br/>• Seguro = Total PNG × seguro%<br/>• IVA Flete = (Flete + Seguro) × 21%<br/>• Total Flete = Flete + Seguro + IVA Flete</p>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-700">📊 SUBTOTAL & MARGEN</h4>
            <p className="text-gray-700">• Subtotal = Total PNG<br/>• Margen = Subtotal × margen%</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange-700">💰 VENTA</h4>
            <p className="text-gray-700">• Precio Neto = Subtotal + Margen<br/>• IIBB = Precio Neto × 3.5%<br/>• IVA Venta = (Precio Neto + IIBB + Total Flete) × IVA%</p>
          </div>
          <div>
            <h4 className="font-semibold text-green-700">🎯 TOTALES</h4>
            <p className="text-gray-700">• Total Unit = (Precio Neto + IVA + IIBB + IIBB + Total Flete) / cantidad<br/>• Precio Venta = Total Unit × cantidad</p>
          </div>
        </div>
      </div>
    </div>
  );
}
