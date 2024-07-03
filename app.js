const fileInput = document.getElementById('fileInput');
const cfdiTableBody = document.querySelector('#cfdi-table tbody');
const cfdiViewer = document.getElementById('cfdi-viewer');

// Función para cargar plantillas HTML
async function cargarPlantilla(nombreArchivo) {
  try {
    const response = await fetch(nombreArchivo);
    if (!response.ok) {
      throw new Error(`Error al cargar la plantilla: ${nombreArchivo}`);
    }
    return await response.text();
  } catch (error) {
    console.error(error);
    return '';
  }
}

fileInput.addEventListener('change', (event) => {
  cfdiTableBody.innerHTML = ''; // Limpia la tabla
  const files = event.target.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = (e) => {
      agregarCfdiALaTabla(file.name, e.target.result);
    };

    reader.readAsText(file);
  }
});

function agregarCfdiALaTabla(nombreArchivo, xmlData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");

  const emisorNombre = xmlDoc.getElementsByTagName("cfdi:Emisor")[0].getAttribute("Nombre");
  const tipoComprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("TipoDeComprobante");
  const version = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Version");

  let tipoComprobanteTexto = obtenerTipoComprobante(tipoComprobante);

  const newRow = cfdiTableBody.insertRow();
  newRow.innerHTML = `
      <td>${nombreArchivo}</td>
      <td>${emisorNombre}</td>
      <td>${tipoComprobanteTexto} v${version}</td>
  `;

  newRow.addEventListener('click', () => {
    mostrarCfdi(xmlData, tipoComprobante, version);
  });
}

function obtenerTipoComprobante(tipo) {
  switch (tipo) {
    case 'I': return 'Factura';
    case 'D': return 'Nota de Débito';
    case 'P': return 'Pago';
    default: return 'Desconocido';
  }
}

function mostrarCfdi(xmlData, tipoComprobante, version) {
  let nombrePlantilla = `plantilla-${tipoComprobante.toLowerCase().replace(/ /g, '-')}-`;
  nombrePlantilla += (version === '4.0') ? '4.0.html' : '3.3.html';

  cargarPlantilla(nombrePlantilla)
    .then(plantilla => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      plantilla = reemplazarMarcadores(plantilla, xmlDoc);

      cfdiViewer.innerHTML = plantilla;
    })
    .catch(error => {
      console.error(`Error al cargar la plantilla: ${error}`);
      cfdiViewer.innerHTML = `<p>Error al cargar la plantilla para ${tipoComprobante} v${version}</p>`;
    });
}

function reemplazarMarcadores(plantilla, xmlDoc) {
  // Datos generales del CFDI
  plantilla = plantilla.replace('{SERIE}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Serie") || '');
  plantilla = plantilla.replace('{FOLIO}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Folio") || '');
  plantilla = plantilla.replace('{FECHA}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Fecha") || '');
  plantilla = plantilla.replace('{TIPO_COMPROBANTE}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("TipoDeComprobante") || '');
  plantilla = plantilla.replace('{VERSION}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Version") || '');
  plantilla = plantilla.replace('{FORMA_PAGO}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("FormaPago") || '');

  // Datos del Emisor
  plantilla = plantilla.replace('{EMISOR_NOMBRE}', xmlDoc.getElementsByTagName("cfdi:Emisor")[0].getAttribute("Nombre") || '');
  plantilla = plantilla.replace('{EMISOR_RFC}', xmlDoc.getElementsByTagName("cfdi:Emisor")[0].getAttribute("Rfc") || '');

  // Datos del Receptor
  plantilla = plantilla.replace('{RECEPTOR_NOMBRE}', xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("Nombre") || '');
  plantilla = plantilla.replace('{RECEPTOR_RFC}', xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("Rfc") || '');

  // Totales
  plantilla = plantilla.replace('{SUBTOTAL}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("SubTotal") || '');
  // ... (Agrega los reemplazos para otros totales: IVA, Total, etc.)

  // Conceptos 
  const conceptos = xmlDoc.getElementsByTagName("cfdi:Concepto");
  let conceptosHTML = '';
  for (let i = 0; i < conceptos.length; i++) {
    conceptosHTML += `
      <tr>
        <td>${conceptos[i].getAttribute("Descripcion") || ''}</td>
        <td>${conceptos[i].getAttribute("Cantidad") || ''}</td>
        <td>${conceptos[i].getAttribute("ClaveUnidad") || ''}</td>
        <td>${conceptos[i].getAttribute("ValorUnitario") || ''}</td>
        <td>${conceptos[i].getAttribute("Importe") || ''}</td>
      </tr>
    `;
  }
  plantilla = plantilla.replace('{CONCEPTOS}', conceptosHTML);

  // Totales
  plantilla = plantilla.replace('{SUBTOTAL}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("SubTotal") || '0.00');
  plantilla = plantilla.replace('{TOTAL}', xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Total") || '0.00');

  // Impuestos (IVA)
  let iva = '0.00';
  const traslados = xmlDoc.getElementsByTagName("cfdi:Traslado");
  if (traslados.length > 0) { 
    iva = traslados[0].getAttribute("Importe") || '0.00'; 
  }
  plantilla = plantilla.replace('{IVA}', iva); 

  // Retenciones 
  let retenciones = '0.00';
  const retencionesXML = xmlDoc.getElementsByTagName("cfdi:Retencion");
  if (retencionesXML.length > 0) { 
    retenciones = retencionesXML[0].getAttribute("Importe") || '0.00'; 
  }
  plantilla = plantilla.replace('{RETENCIONES}', retenciones);

  return plantilla;
}