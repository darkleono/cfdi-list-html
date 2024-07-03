const fileInput = document.getElementById('fileInput');
const cfdiTableBody = document.querySelector('#cfdi-table tbody');
const cfdiViewer = document.getElementById('cfdi-viewer');

fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    cfdiTableBody.innerHTML = ''; // Limpia la tabla antes de agregar archivos

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = (e) => {
            const xmlData = e.target.result;
            agregarCfdiALaTabla(file.name, xmlData);
        };

        reader.readAsText(file);
    }
});

function agregarCfdiALaTabla(nombreArchivo, xmlData) {
    // 1. Parsear XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    // 2. Extraer datos
    const emisorNombre = xmlDoc.getElementsByTagName("cfdi:Emisor")[0].getAttribute("Nombre");
    const tipoComprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("TipoDeComprobante");
    const version = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Version");

    // 3. Determinar el tipo de comprobante
    let tipoComprobanteTexto = '';
    switch (tipoComprobante) {
        case 'I':
            tipoComprobanteTexto = 'Factura';
            break;
        case 'D':
            tipoComprobanteTexto = 'Nota de Débito';
            break;
        case 'P':
            tipoComprobanteTexto = 'Pago';
            break;
        // ... otros tipos de comprobantes
        default:
            tipoComprobanteTexto = 'Desconocido'; 
    }

    // 3. Crear la fila en la tabla
    const newRow = cfdiTableBody.insertRow();
    newRow.innerHTML = `
        <td>${nombreArchivo}</td>
        <td>${emisorNombre}</td>
        <td>${tipoComprobanteTexto} v${version}</td>
    `;

    // 4. Agregar evento click a la fila
    newRow.addEventListener('click', () => {
        mostrarCfdi(xmlData);
    });
}

function mostrarCfdi(xmlData) {
    // 1. Parsear el XML con DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    // 2. Extraer datos del XML (agrega más campos según necesites)
    const serie = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Serie") || 'null'; 
    const folio = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Folio") || 'null'; 
    const fecha = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Fecha") || 'null';
    const emisorNombre = xmlDoc.getElementsByTagName("cfdi:Emisor")[0].getAttribute("Nombre") || 'null';
    const receptorNombre = xmlDoc.getElementsByTagName("cfdi:Receptor")[0].getAttribute("Nombre") || 'null'; 

    // 3. Construir el HTML para mostrar la información
    const htmlContent = `
      <h2>Información del CFDI</h2>
      <p><strong>Serie:</strong> ${serie}</p>
      <p><strong>Folio:</strong> ${folio}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Emisor:</strong> ${emisorNombre}</p>
      <p><strong>Receptor:</strong> ${receptorNombre}</p>
      <!-- Agrega más campos según sea necesario -->
    `;

    // 4. Reemplazar el contenido del panel lateral
    cfdiViewer.innerHTML = htmlContent; 
}