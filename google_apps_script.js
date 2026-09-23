/**
 * ==============================================================================
 * DROPSCALE COMMERCE - GOOGLE APPS SCRIPT WEBHOOK
 * ==============================================================================
 * Este script recibe los datos del formulario de registro de DropScale y los
 * almacena en tiempo real en esta hoja de cálculo de Google Sheets.
 * 
 * INSTRUCCIONES DE INSTALACIÓN (2 MINUTOS):
 * 1. Abre tu Google Sheets (o crea uno nuevo en drive.google.com).
 * 2. En el menú superior, ve a: Extensiones > Apps Script.
 * 3. Borra todo el código que aparezca y pega este archivo completo.
 * 4. Haz clic en el botón de Guardar (icono de disquete).
 * 5. Haz clic en el botón azul "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 6. En el tipo, selecciona "Aplicación web" (icono de engranaje).
 * 7. Configura lo siguiente:
 *    - Descripción: DropScale Leads Webhook
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier persona" (¡MUY IMPORTANTE para permitir envíos desde la web!)
 * 8. Haz clic en "Implementar" y autoriza los permisos si te los solicita.
 * 9. Copia la "URL de la aplicación web" generada (termina en /exec).
 * 10. Pega esa URL en tu archivo app.js en la variable GOOGLE_SHEETS_WEBHOOK_URL.
 * ==============================================================================
 */

// Lista oficial de Nichos para validación y filtrado
const NICHOS_DISPONIBLES = [
  "Belleza y Cuidado Personal",
  "Salud, Bienestar y Fitness",
  "Moda, Ropa y Calzado",
  "Tecnología, Gadgets y Electrónica",
  "Hogar, Cocina y Organización",
  "Mascotas",
  "Joyería, Relojes y Accesorios",
  "Bebés, Niños y Maternidad",
  "Herramientas y Ferretería",
  "Deportes y Aire Libre",
  "Otro Nicho"
];

// Lista de Estados comerciales para gestión del lead
const ESTADOS_DISPONIBLES = [
  "🟢 Nuevo Lead",
  "🟡 Contactado",
  "🔵 En Diagnóstico Comercial",
  "✅ Cliente Cerrado",
  "❌ No Califica / No Interesado"
];

// Encabezados oficiales de la tabla
const HEADERS = [
  "Fecha y Hora",
  "Nombre",
  "Apellido",
  "Celular",
  "Correo Electrónico",
  "¿Ha Vendido Antes?",
  "Ventas Diarias Aprox",
  "Nicho de Mercado",
  "Producto Previo / Experiencia",
  "Producto Interés",
  "Estado"
];

/**
 * Manejador principal de peticiones POST desde la landing page
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Manejador de peticiones GET (útil para pruebas y redirecciones)
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Función central de procesamiento y guardado de datos
 */
function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Esperar hasta 10 segundos para evitar colisiones en envíos simultáneos
  lock.tryLock(10000);

  try {
    let data = {};

    // Extraer datos dependiendo del método de envío
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        // En caso de que venga como FormUrlEncoded
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const sheet = getOrCreateLeadsSheet();

    // Valores ordenados según los HEADERS
    const row = [
      data.fecha || Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd HH:mm:ss"),
      data.nombre || "",
      data.apellido || "",
      data.celular ? "'" + data.celular : "", // Prefijo ' para conservar números con cero inicial
      data.correo || "",
      data.haVendido || "No especificado",
      data.ventasDiarias || "N/A",
      data.nicho || "Por definir",
      data.productoAnterior || "N/A",
      data.productoNuevo || "Por definir con asesor",
      "🟢 Nuevo Lead" // Estado inicial por defecto
    ];

    // Insertar la fila al final
    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    // Aplicar listas desplegables (Validación de Datos) en la fila insertada
    aplicarValidacionesFila(sheet, lastRow);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead registrado exitosamente en Google Sheets",
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Obtiene la hoja activa o la crea con encabezados y diseño profesional
 */
function getOrCreateLeadsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Leads DropScale");

  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName("Leads DropScale");
  }

  // Si la hoja está vacía, configuramos los encabezados
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);

    // Formatear fila de encabezados
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#5F0AC7"); // Color oficial DropScale
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);

    // Congelar la fila 1 para facilitar scroll
    sheet.setFrozenRows(1);

    // Autoajustar anchos de columnas
    for (let c = 1; c <= HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }

  return sheet;
}

/**
 * Aplica menús desplegables (Data Validation) en las celdas de Nicho y Estado
 */
function aplicarValidacionesFila(sheet, rowNumber) {
  try {
    // Columna 8: Nicho de Mercado
    const reglaNicho = SpreadsheetApp.newDataValidation()
      .requireValueInList(NICHOS_DISPONIBLES, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(rowNumber, 8).setDataValidation(reglaNicho);

    // Columna 11: Estado del Lead
    const reglaEstado = SpreadsheetApp.newDataValidation()
      .requireValueInList(ESTADOS_DISPONIBLES, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(rowNumber, 11).setDataValidation(reglaEstado);

    // Centrar ciertas columnas numéricas y de estado
    sheet.getRange(rowNumber, 1).setHorizontalAlignment("center"); // Fecha
    sheet.getRange(rowNumber, 4).setHorizontalAlignment("center"); // Celular
    sheet.getRange(rowNumber, 6).setHorizontalAlignment("center"); // Ha vendido
    sheet.getRange(rowNumber, 7).setHorizontalAlignment("center"); // Ventas diarias
    sheet.getRange(rowNumber, 11).setHorizontalAlignment("center"); // Estado
  } catch (err) {
    // Silencioso si no se pudo aplicar validación en esa celda específica
  }
}
