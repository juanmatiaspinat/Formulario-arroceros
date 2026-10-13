/**
 * ==============================================================================
 * DECLARACIÓN JURADA ARROCEROS - MINISTERIO DE PRODUCCIÓN DE CORRIENTES
 * LÓGICA PRINCIPAL (APP.JS)
 * ==============================================================================
 * 
 * 1. ALTERNANCIA DINÁMICA: PERSONA FÍSICA / PERSONA JURÍDICA Y FORMATO CUIT
 * 2. MAPA LEAFLET OFICIAL (ESRI SATÉLITE + IGN + DIBUJO Y GEOLOCALIZACIÓN)
 * 3. GENERADOR DE PDF EN MEMORIA (JSPDF + AUTOTABLE)
 * 4. ENVÍO DEL FORMULARIO Y CONSUMO DE API APPS SCRIPT
 * 5. VALIDACIÓN EN TIEMPO REAL Y CONTROL DE BADGES POR SECCIÓN
 * 6. BASE DE DATOS GEOGRÁFICA Y CASCADA DE DOMICILIO
 * 7. SECCIÓN PREDIO, TENENCIA Y MÁSCARAS ESTRICTAS (PARTIDAS Y RENSPA)
 * 8. RESTRICCIONES Y VALIDACIONES SEMÁNTICAS GLOBALES
 */

// URL DEL APPS SCRIPT PUBLICADO (WEB APP)
const SCRIPT_URL = "PEGAR_ACA_LA_URL_DE_TU_APPS_SCRIPT";

// ==============================================================================
// 1. ALTERNANCIA DINÁMICA: PERSONA FÍSICA / PERSONA JURÍDICA
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const selectTipoPersona = document.getElementById("tipo_persona");
  const bloqueFisica = document.getElementById("bloquePersonaFisica");
  const bloqueJuridica = document.getElementById("bloquePersonaJuridica");

  const selectCaracter = document.getElementById("caracter_sociedad");
  const grupoCaracterOtro = document.getElementById("grupoCaracterOtro");
  const inputCaracterOtro = document.getElementById("caracter_otro");

  function actualizarVisibilidadTipoPersona() {
    const esJuridica = selectTipoPersona.value === "Jurídica";

    if (esJuridica) {
      bloqueFisica.style.display = "none";
      bloqueJuridica.style.display = "block";

      // Desactivar campos requeridos de Persona Física
      document.getElementById("productor_fisica").required = false;
      document.getElementById("num_doc").required = false;
      document.getElementById("cuit_fisica").required = false;

      // Activar campos requeridos de Persona Jurídica
      document.getElementById("declarante_juridica").required = true;
      document.getElementById("cuil_declarante").required = true;
      document.getElementById("caracter_sociedad").required = true;
      document.getElementById("razon_social").required = true;
      document.getElementById("cuit_empresa").required = true;
    } else {
      bloqueFisica.style.display = "block";
      bloqueJuridica.style.display = "none";

      // Activar campos requeridos de Persona Física
      document.getElementById("productor_fisica").required = true;
      document.getElementById("num_doc").required = true;
      document.getElementById("cuit_fisica").required = true;

      // Desactivar campos requeridos de Persona Jurídica
      document.getElementById("declarante_juridica").required = false;
      document.getElementById("cuil_declarante").required = false;
      document.getElementById("caracter_sociedad").required = false;
      document.getElementById("razon_social").required = false;
      document.getElementById("cuit_empresa").required = false;
      if (inputCaracterOtro) inputCaracterOtro.required = false;
    }

    // Revalidar la sección 1 para actualizar el badge de estado
    const sec1 = document.getElementById("sec-1");
    if (sec1) validarSeccion(sec1, "badge-sec-1");
  }

  if (selectTipoPersona) {
    selectTipoPersona.addEventListener("change", actualizarVisibilidadTipoPersona);
  }

  // Mostrar u ocultar el campo condicional "¿Con cuál?"
  if (selectCaracter) {
    selectCaracter.addEventListener("change", () => {
      if (selectCaracter.value === "Otro") {
        grupoCaracterOtro.style.display = "flex";
        inputCaracterOtro.required = true;
      } else {
        grupoCaracterOtro.style.display = "none";
        inputCaracterOtro.required = false;
        inputCaracterOtro.value = "";
      }

      const sec1 = document.getElementById("sec-1");
      if (sec1) validarSeccion(sec1, "badge-sec-1");
    });
  }

  // Formato automático de CUIT con guiones (XX-XXXXXXXX-X)
  document.querySelectorAll(".input-cuit").forEach((input) => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 10) {
        e.target.value = `${v.slice(0, 2)}-${v.slice(2, 10)}-${v.slice(10)}`;
      } else if (v.length > 2) {
        e.target.value = `${v.slice(0, 2)}-${v.slice(2)}`;
      } else {
        e.target.value = v;
      }
    });
  });

  // Desplegable de Ayuda: Sección 1 ¿Qué documentación tener a mano?
  const btnToggleAyuda = document.getElementById("btnToggleDocAyuda");
  const contenidoAyuda = document.getElementById("contenidoDocAyuda");
  const flechaAyuda = document.getElementById("flechaAyuda");

  if (btnToggleAyuda && contenidoAyuda) {
    btnToggleAyuda.addEventListener("click", () => {
      contenidoAyuda.classList.toggle("abierto");
      if (flechaAyuda) flechaAyuda.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: Sección 2 (Contacto)
  const btnAyudaContacto = document.getElementById("btnToggleDocAyudaContacto");
  const contAyudaContacto = document.getElementById("contenidoDocAyudaContacto");
  const flechaContacto = document.getElementById("flechaAyudaContacto");

  if (btnAyudaContacto && contAyudaContacto) {
    btnAyudaContacto.addEventListener("click", () => {
      contAyudaContacto.classList.toggle("abierto");
      if (flechaContacto) flechaContacto.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: Sección 3 (Domicilio)
  const btnAyudaDomicilio = document.getElementById("btnToggleDocAyudaDomicilio");
  const contAyudaDomicilio = document.getElementById("contenidoDocAyudaDomicilio");
  const flechaDomicilio = document.getElementById("flechaAyudaDomicilio");

  if (btnAyudaDomicilio && contAyudaDomicilio) {
    btnAyudaDomicilio.addEventListener("click", () => {
      contAyudaDomicilio.classList.toggle("abierto");
      if (flechaDomicilio) flechaDomicilio.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: Sección 4 (Predio y Tenencia)
  const btnAyudaPredio = document.getElementById("btnToggleDocAyudaPredio");
  const contAyudaPredio = document.getElementById("contenidoDocAyudaPredio");
  const flechaPredio = document.getElementById("flechaAyudaPredio");

  if (btnAyudaPredio && contAyudaPredio) {
    btnAyudaPredio.addEventListener("click", () => {
      contAyudaPredio.classList.toggle("abierto");
      if (flechaPredio) flechaPredio.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: Sección 5 (Producción)
  const btnAyudaProduccion = document.getElementById("btnToggleDocAyudaProduccion");
  const contAyudaProduccion = document.getElementById("contenidoDocAyudaProduccion");
  const flechaProduccion = document.getElementById("flechaAyudaProduccion");

  if (btnAyudaProduccion && contAyudaProduccion) {
    btnAyudaProduccion.addEventListener("click", () => {
      contAyudaProduccion.classList.toggle("abierto");
      if (flechaProduccion) flechaProduccion.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: Sección 6 (Mapa interactivo)
  const btnAyudaMapa = document.getElementById("btnToggleDocAyudaMapa");
  const contAyudaMapa = document.getElementById("contenidoDocAyudaMapa");
  const flechaMapa = document.getElementById("flechaAyudaMapa");

  if (btnAyudaMapa && contAyudaMapa) {
    btnAyudaMapa.addEventListener("click", () => {
      contAyudaMapa.classList.toggle("abierto");
      if (flechaMapa) flechaMapa.classList.toggle("rotada");
    });
  }

  // Desplegable de Ayuda: General (Encabezado)
  const btnAyudaGeneral = document.getElementById("btnToggleDocAyudaGeneral");
  const contAyudaGeneral = document.getElementById("contenidoDocAyudaGeneral");
  const flechaGeneral = document.getElementById("flechaAyudaGeneral");

  if (btnAyudaGeneral && contAyudaGeneral) {
    btnAyudaGeneral.addEventListener("click", () => {
      contAyudaGeneral.classList.toggle("abierto");
      if (flechaGeneral) flechaGeneral.classList.toggle("rotada");
    });
  }

  // Inicializaciones al cargar el documento
  actualizarVisibilidadTipoPersona();
  inicializarControlBadges();
  inicializarCascadaDomicilio();
  inicializarPredioYTenencia();
  inicializarRestriccionesCampos();
});

// ==============================================================================
// 2. MAPA LEAFLET OFICIAL (ESRI SATÉLITE + MAPA IGN + DIBUJO ILIMITADO Y GPS)
// ==============================================================================
let map;
let capaSatelite, capaIGN;
let polygonLayer = null;
let polylineTemporal = null;
let puntosLote = [];
let marcadoresVertices = [];
let marcadorUbicacionGPS = null;
let modoDibujoActivo = false;

document.addEventListener("DOMContentLoaded", () => {
  const contenedorMapa = document.getElementById("mapaLote");
  if (!contenedorMapa) return;

  map = L.map("mapaLote").setView([-28.5, -57.8], 7);

  capaSatelite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 18
  }).addTo(map);

  capaIGN = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Instituto Geográfico Nacional / OSM",
    maxZoom: 18
  });

  // Conmutador de capas satelital e IGN
  document.getElementById("btnCapaSatelite").addEventListener("click", () => {
    map.removeLayer(capaIGN);
    map.addLayer(capaSatelite);
    document.getElementById("btnCapaSatelite").classList.add("active");
    document.getElementById("btnCapaIGN").classList.remove("active");
  });

  document.getElementById("btnCapaIGN").addEventListener("click", () => {
    map.removeLayer(capaSatelite);
    map.addLayer(capaIGN);
    document.getElementById("btnCapaIGN").classList.add("active");
    document.getElementById("btnCapaSatelite").classList.remove("active");
  });

  document.getElementById("btnDibujarLote").addEventListener("click", () => {
    iniciarModoDibujo();
  });

  map.on("click", (e) => {
    if (modoDibujoActivo) {
      agregarVertice(e.latlng.lat, e.latlng.lng);
    }
  });

  map.on("dblclick", () => {
    if (modoDibujoActivo && puntosLote.length >= 3) {
      cerrarPoligono();
    }
  });

  // Geolocalización del dispositivo
  document.getElementById("btnDetectarUbicacion").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });

        if (marcadorUbicacionGPS) map.removeLayer(marcadorUbicacionGPS);
        marcadorUbicacionGPS = L.circleMarker([lat, lng], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: "#2563eb",
          fillOpacity: 1
        }).addTo(map).bindPopup("Tu ubicación actual").openPopup();
      },
      (err) => {
        alert("No se pudo detectar la ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Panel plegable de coordenadas
  document.getElementById("btnAbrirCargarCoords").addEventListener("click", () => {
    const caja = document.getElementById("cajaCargarCoords");
    caja.style.display = caja.style.display === "none" ? "block" : "none";
  });

  document.getElementById("btnCancelarCoords").addEventListener("click", () => {
    document.getElementById("cajaCargarCoords").style.display = "none";
  });

  document.getElementById("btnAplicarCoords").addEventListener("click", () => {
    const textoCoords = document.getElementById("inputCoordenadaCampo").value.trim();
    const supHa = parseFloat(document.getElementById("inputSuperficieLote").value) || 3.5;

    if (!textoCoords) {
      alert("Ingresá al menos una coordenada (latitud, longitud).");
      return;
    }

    const lineas = textoCoords.split("\n").map(l => l.trim()).filter(Boolean);
    if (lineas.length === 1) {
      const partes = lineas[0].replace(/[^\d.,-]/g, "").split(",");
      if (partes.length >= 2) {
        const lat = parseFloat(partes[0]);
        const lng = parseFloat(partes[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 15);
          crearCuadradoAlrededorDePunto(lat, lng, supHa);
          document.getElementById("cajaCargarCoords").style.display = "none";
        } else {
          alert("Coordenada no válida. Ejemplo: -27.4691, -58.8306");
        }
      }
    } else {
      puntosLote = [];
      lineas.forEach(lin => {
        const p = lin.replace(/[^\d.,-]/g, "").split(",");
        if (p.length >= 2) {
          const lat = parseFloat(p[0]);
          const lng = parseFloat(p[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            puntosLote.push([lat, lng]);
          }
        }
      });

      if (puntosLote.length >= 3) {
        cerrarPoligono();
        document.getElementById("cajaCargarCoords").style.display = "none";
      } else {
        alert("Se necesitan al menos 3 vértices para formar un lote.");
      }
    }
  });

  document.getElementById("btnBorrarDibujo").addEventListener("click", limpiarTodoElMapa);

  document.getElementById("btnAjustarEsquinas").addEventListener("click", () => {
    activarVerticesArrastrables();
  });
});

function iniciarModoDibujo() {
  limpiarTodoElMapa();
  modoDibujoActivo = true;
  document.getElementById("mapaInstruccion").innerText = "Hacé clic en el mapa para marcar las esquinas. Tocá el primer punto (círculo verde) para cerrar el lote.";

  // Activa el cursor de precisión en el mapa
  const contMapa = document.getElementById("mapaLote");
  if (contMapa) contMapa.classList.add("mapa-modo-dibujo");
}

function agregarVertice(lat, lng) {
  if (puntosLote.length >= 3) {
    const primerPunto = puntosLote[0];
    const distancia = map.distance([lat, lng], primerPunto);
    if (distancia < 25) {
      cerrarPoligono();
      return;
    }
  }

  puntosLote.push([lat, lng]);
  const esPrimerPunto = puntosLote.length === 1;

  const marker = L.circleMarker([lat, lng], {
    radius: esPrimerPunto ? 7 : 5,
    color: esPrimerPunto ? "#15803d" : "#f59e0b",
    fillColor: esPrimerPunto ? "#22c55e" : "#fbbf24",
    fillOpacity: 1,
    weight: esPrimerPunto ? 3 : 2
  }).addTo(map);

  if (esPrimerPunto) {
    marker.bindTooltip("Clic acá para cerrar", { permanent: false, direction: "top" });
    marker.on("click", (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (puntosLote.length >= 3) {
        cerrarPoligono();
      }
    });
  }

  marcadoresVertices.push(marker);

  if (polylineTemporal) map.removeLayer(polylineTemporal);
  polylineTemporal = L.polyline(puntosLote, {
    color: "#f59e0b",
    weight: 2,
    dashArray: "4, 4"
  }).addTo(map);
}

function cerrarPoligono(hectareasForzadas) {
  modoDibujoActivo = false;

  // Remueve el cursor de dibujo y vuelve al cursor habitual
  const contMapa = document.getElementById("mapaLote");
  if (contMapa) contMapa.classList.remove("mapa-modo-dibujo");

  if (polylineTemporal) {
    map.removeLayer(polylineTemporal);
    polylineTemporal = null;
  }
  if (polygonLayer) map.removeLayer(polygonLayer);
  marcadoresVertices.forEach(m => map.removeLayer(m));
  marcadoresVertices = [];

  polygonLayer = L.polygon(puntosLote, {
    color: "#fbbf24",
    weight: 3,
    fillColor: "#fef08a",
    fillOpacity: 0.3
  }).addTo(map);

  map.fitBounds(polygonLayer.getBounds(), { padding: [30, 30] });

  const ha = hectareasForzadas || calcularHectareas(puntosLote);
  document.getElementById("txtHectareasCalc").innerText = `· ${ha.toFixed(1).replace(".", ",")} ha de referencia`;

  document.getElementById("barraHerramientasInicial").style.display = "none";
  document.getElementById("barraHerramientasDibujado").style.display = "flex";
  document.getElementById("txtNotaLote").style.display = "block";
  document.getElementById("mapaInstruccion").innerText = "Las esquinas se ajustan arrastrándolas. También podés borrar el dibujo y volver a empezar.";

  document.getElementById("coordenadas_lote").value = JSON.stringify(puntosLote);

  activarVerticesArrastrables();
}

function crearCuadradoAlrededorDePunto(lat, lng, supHa) {
  limpiarTodoElMapa();
  const ladoGrados = Math.sqrt(supHa) * 0.0009;
  const dLat = ladoGrados / 2;
  const dLng = ladoGrados / 2;

  puntosLote = [
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
    [lat - dLat, lng - dLng]
  ];

  cerrarPoligono(supHa);
}

function activarVerticesArrastrables() {
  marcadoresVertices.forEach(m => map.removeLayer(m));
  marcadoresVertices = [];

  puntosLote.forEach((pt, idx) => {
    const marker = L.marker(pt, { draggable: true }).addTo(map);

    marker.on("drag", (e) => {
      puntosLote[idx] = [e.latlng.lat, e.latlng.lng];
      polygonLayer.setLatLngs(puntosLote);
      const ha = calcularHectareas(puntosLote);
      document.getElementById("txtHectareasCalc").innerText = `· ${ha.toFixed(1).replace(".", ",")} ha de referencia`;
      document.getElementById("coordenadas_lote").value = JSON.stringify(puntosLote);
    });

    marcadoresVertices.push(marker);
  });
}

function calcularHectareas(coords) {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i][1] * coords[j][0];
    area -= coords[j][1] * coords[i][0];
  }
  area = Math.abs(area) / 2;
  const metrosCuadrados = area * 111320 * (111320 * Math.cos(-28.5 * Math.PI / 180));
  return metrosCuadrados / 10000;
}

function limpiarTodoElMapa() {
  // Remueve el cursor de dibujo si estaba activo
  const contMapa = document.getElementById("mapaLote");
  if (contMapa) contMapa.classList.remove("mapa-modo-dibujo");

  if (polygonLayer) map.removeLayer(polygonLayer);
  polygonLayer = null;
  if (polylineTemporal) map.removeLayer(polylineTemporal);
  polylineTemporal = null;
  marcadoresVertices.forEach(m => map.removeLayer(m));
  marcadoresVertices = [];
  puntosLote = [];
  modoDibujoActivo = false;

  document.getElementById("barraHerramientasInicial").style.display = "flex";
  document.getElementById("barraHerramientasDibujado").style.display = "none";
  document.getElementById("txtNotaLote").style.display = "none";
  document.getElementById("cajaCargarCoords").style.display = "none";
  document.getElementById("coordenadas_lote").value = "";
  document.getElementById("mapaInstruccion").innerText = "Marcar el lote en el mapa es opcional: la declaración se presenta igual. Marcarlo ayuda a que la evaluación ubique el terreno afectado.";
}

// ==============================================================================
// 3. GENERADOR DE PDF EN MEMORIA (JSPDF + AUTOTABLE)
// ==============================================================================
function generarPdfEnMemoria(data, numComprobante, fechaHoraStr) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Encabezado Institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(46, 45, 44);
  doc.text("GOBIERNO DE LA PROVINCIA DE CORRIENTES", 14, 18);
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Ministerio de Producción — Dirección de Economía Agraria", 14, 24);
  doc.text("DECLARACIÓN JURADA DE PRODUCCIÓN ARROCERA", 14, 29);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 32, 196, 32);

  // Metadatos del Trámite
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(46, 45, 44);
  doc.text(`Comprobante N°: ${numComprobante}`, 14, 37);
  doc.text(`Fecha y Hora: ${fechaHoraStr}`, 130, 37);

  // Mapeo condicional Persona Física / Jurídica
  const esJuridica = data.tipo_persona === "Jurídica";
  const nombreProductor = esJuridica ? data.razon_social : data.productor_fisica;
  const cuitProductor = esJuridica ? data.cuit_empresa : data.cuit_fisica;
  const docIdentidad = esJuridica
    ? `Declarante: ${data.declarante_juridica || "-"} (CUIL: ${data.cuil_declarante || "-"})`
    : `${data.tipo_doc || "DNI"}: ${data.num_doc || "-"}`;
  const sexoProductor = esJuridica ? (data.sexo_juridica || "-") : (data.sexo_fisica || "-");
  const caracterFirma = esJuridica
    ? (data.caracter_sociedad === "Otro" ? `Otro: ${data.caracter_otro || "-"}` : data.caracter_sociedad || "-")
    : "Titular";

  // TABLA 1: DATOS DEL PRODUCTOR Y CONTACTO
  const bodyTabla1 = [
    ["Apellido y Nombre / Razón Social", nombreProductor || "-"],
    ["Tipo de Persona", data.tipo_persona || "Física"],
    ["Documento de Identidad / Declarante", docIdentidad],
    ["Carácter ante la sociedad", caracterFirma],
    ["CUIT / CUIL", cuitProductor || "-"],
    ["Sexo", sexoProductor],
    ["Teléfono Principal", data.telefono1 || "-"],
    ["Correo Electrónico", data.email || "-"]
  ];

  doc.autoTable({
    startY: 41,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["1. DATOS DEL PRODUCTOR Y CONTACTO", "DETALLE"]],
    body: bodyTabla1,
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5, textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [46, 45, 44] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } }
  });

  // TABLA 2: DOMICILIO
  const locDetalle = `${data.domicilio_municipio || "-"}, Depto: ${data.domicilio_depto || "-"}`;

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 4,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["2. DOMICILIO (PARTICULAR O LEGAL)", "DETALLE"]],
    body: [
      ["Tipo de Domicilio", data.domicilio_tipo || "Particular"],
      ["Calle / Ruta y Número", data.domicilio_calle || "-"],
      ["Municipio y Departamento", locDetalle],
      ["Provincia y País", `${data.domicilio_provincia || "Corrientes"}, ${data.domicilio_pais || "Argentina"}`]
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5, textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [46, 45, 44] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } }
  });

  // TABLA 3: PREDIO Y PRODUCCIÓN ARROCERA
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 4,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["3. PREDIO Y PRODUCCIÓN ARROCERA", "VALOR"]],
    body: [
      ["Departamento / Municipio del Predio", `${data.departamento || "-"} / ${data.municipio || "-"}`],
      ["N° Partida Inmobiliaria (Adrema)", data.partida || "-"],
      ["Tenencia de la Partida", data.tenencia || "-"],
      ["RENSPA", data.renspa || "-"],
      ["Superficie Total Destinada (Ha)", `${data.sup_arroz || "0.0"} ha`],
      ["Superficie Sembrada / Regada (Ha)", `${data.sup_sembrada || "0.0"} ha / ${data.sup_regada || "0.0"} ha`],
      ["Fecha Inicio Siembra / Campaña", `${data.fecha_siembra || "-"} (Campaña ${data.campana || "2026/2027"})`],
      ["Coordenadas del Lote (GPS)", data.coordenadas_lote ? "Geometría trazada en el mapa" : "No informadas en mapa"]
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5, textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [46, 45, 44] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } }
  });

  // Texto Legal al pie
  const yLegal = doc.lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 53, 15);
  const textoLegal = "DECLARO BAJO JURAMENTO QUE LOS DATOS CONSIGNADOS PRECEDENTEMENTE SON VERACES Y REFLEJAN LA REALIDAD DEL ESTABLECIMIENTO. ASUMO CONOCER LAS SANCIONES ESPECIFICADAS POR LA LEY QUE ME CORRESPONDE EN CASO DE VERIFICARSE FALSEDAD EN LOS DATOS (ART. 292 Y 293 CÓDIGO PENAL DE LA NACIÓN).";
  doc.text(textoLegal, 14, yLegal, { maxWidth: 182 });

  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}

// ==============================================================================
// 4. ENVÍO DEL FORMULARIO
// ==============================================================================
document.getElementById("arrozForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Verificación global de todas las secciones antes de enviar
  const secciones = [
    { sec: document.getElementById("sec-1"), badge: "badge-sec-1" },
    { sec: document.getElementById("sec-2"), badge: "badge-sec-2" },
    { sec: document.getElementById("sec-3"), badge: "badge-sec-3" },
    { sec: document.getElementById("sec-4"), badge: "badge-sec-4" },
    { sec: document.getElementById("sec-5"), badge: "badge-sec-5" }
  ];

  let hayErrores = false;
  secciones.forEach(({ sec, badge }) => {
    if (sec && !validarSeccion(sec, badge)) {
      hayErrores = true;
    }
  });

  if (hayErrores) {
    alert("Por favor revisá los campos señalados con error o incompletos antes de presentar la declaración.");
    return;
  }

  const btn = document.getElementById("btnSubmit");
  btn.disabled = true;
  btn.innerText = "Registrando y enviando declaración...";

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const numComprobante = "ARROZ-" + new Date().getTime().toString().slice(-6);
  const ahora = new Date();
  const fechaHoraStr = ahora.toLocaleDateString("es-AR") + " " + ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const pdfBase64 = generarPdfEnMemoria(data, numComprobante, fechaHoraStr);

  const payload = {
    ...data,
    comprobante: numComprobante,
    pdfBase64: pdfBase64
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    form.style.display = "none";
    const msg = document.getElementById("mensajeExito");
    const txtComp = document.getElementById("txtComprobante");
    txtComp.innerText = `N° de Comprobante: ${numComprobante}`;
    msg.style.display = "block";

  } catch (error) {
    console.error("Error al enviar:", error);
    form.style.display = "none";
    const msg = document.getElementById("mensajeExito");
    const txtComp = document.getElementById("txtComprobante");
    txtComp.innerText = `N° de Comprobante: ${numComprobante}`;
    msg.style.display = "block";
  }
});

// ==============================================================================
// 5. VALIDACIÓN EN TIEMPO REAL Y CONTROL DE BADGES POR SECCIÓN
// ==============================================================================
function validarSeccion(sectionElement, badgeId) {
  const badge = document.getElementById(badgeId);
  if (!sectionElement || !badge) return false;

  const inputs = Array.from(sectionElement.querySelectorAll("input, select, textarea"))
    .filter(el => el.type !== "hidden" && el.offsetParent !== null && !el.disabled);

  let tieneError = false;
  let tieneCamposVacios = false;
  let camposRequeridosContados = 0;
  let camposCompletosContados = 0;

  for (const input of inputs) {
    const val = input.value ? input.value.trim() : "";

    if (input.required) {
      camposRequeridosContados++;
      if (!val) {
        tieneCamposVacios = true;
      } else {
        camposCompletosContados++;
      }
    }

    // Validador nativo de HTML5
    if (val && !input.checkValidity()) {
      tieneError = true;
      break;
    }

    // Validación algorítmica de CUIT / CUIL
    if (input.classList.contains("input-cuit") && val) {
      const limpio = val.replace(/\D/g, "");
      if (limpio.length !== 11 || !validarAlgoritmoCUIT(limpio)) {
        tieneError = true;
        break;
      }
    }

    // Validación de DNI
    if (input.id === "num_doc" && val) {
      if (!/^\d{7,8}$/.test(val)) {
        tieneError = true;
        break;
      }
    }

    // Validación de Correo Electrónico
    if (input.type === "email" && val) {
      if (!validarFormatoEmail(val)) {
        tieneError = true;
        break;
      }
    }

    // Validación de Teléfono
    if ((input.type === "tel" || input.name?.includes("telefono")) && val) {
      if (!validarFormatoTelefono(val)) {
        tieneError = true;
        break;
      }
    }

    // Validación estricta de Partida (Adrema): Prefijo + 6 dígitos + guion + [1|2|3]
    if (input.classList.contains("input-partida") && val) {
      if (!/^[A-ZÑ]\d\s\d{6}-[1-3]$/i.test(val)) {
        tieneError = true;
        break;
      }
    }

    // Validación estricta de RENSPA Corrientes (04.XXX.X.XXXXX/XX)
    if (input.id === "renspa" && val) {
      if (!/^04\.\d{3}\.\d{1}\.\d{5}\/\d{2}$/.test(val)) {
        tieneError = true;
        break;
      }
    }
  }

  if (camposRequeridosContados > 0 && camposCompletosContados < camposRequeridosContados) {
    tieneCamposVacios = true;
  }

  const iconoPuntos = `<span class="badge-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="20" cy="12" r="3"/></svg></span>`;
  const iconoExclamacion = `<span class="badge-icon" style="font-weight:900; font-size:11px;">!</span>`;
  const iconoCheck = `<span class="badge-icon" style="font-weight:900; font-size:11px;">✓</span>`;

  if (tieneError) {
    badge.className = "status-badge error";
    badge.innerHTML = `${iconoExclamacion} <span class="badge-txt">Con errores</span>`;
    return false;
  } else if (tieneCamposVacios || camposRequeridosContados === 0) {
    badge.className = "status-badge incompleto";
    badge.innerHTML = `${iconoPuntos} <span class="badge-txt">Incompleto</span>`;
    return false;
  } else {
    badge.className = "status-badge completo";
    badge.innerHTML = `${iconoCheck} <span class="badge-txt">Completo</span>`;
    return true;
  }
}

function inicializarControlBadges() {
  const secciones = [
    { sec: document.getElementById("sec-1"), badge: "badge-sec-1" },
    { sec: document.getElementById("sec-2"), badge: "badge-sec-2" },
    { sec: document.getElementById("sec-3"), badge: "badge-sec-3" },
    { sec: document.getElementById("sec-4"), badge: "badge-sec-4" },
    { sec: document.getElementById("sec-5"), badge: "badge-sec-5" }
  ];

  secciones.forEach(({ sec, badge }) => {
    if (!sec) return;

    sec.addEventListener("input", () => validarSeccion(sec, badge));
    sec.addEventListener("change", () => validarSeccion(sec, badge));

    validarSeccion(sec, badge);
  });
}

// ==============================================================================
// 6. BASE DE DATOS GEOGRÁFICA Y CASCADA DINÁMICA DE DOMICILIO
// ==============================================================================
const PAISES_MUNDO = [
  "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice",
  "Benín", "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria",
  "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China",
  "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia",
  "Cuba", "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia",
  "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini", "Etiopía", "Filipinas", "Finlandia", "Fiyi", "Francia",
  "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial",
  "Guyana", "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall",
  "Islas Salomón", "Israel", "Italia", "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati",
  "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
  "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio",
  "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru",
  "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos",
  "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana",
  "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania",
  "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe",
  "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán",
  "Sudán del Sur", "Suecia", "Suiza", "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga",
  "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán",
  "Vanuatu", "Vaticano", "Venezuela", "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue"
];

const PROVINCIAS_ARG = [
  "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
  "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
];

const DEPTOS_Y_MUNICIPIOS_CORRIENTES = {
  "Bella Vista": ["Bella Vista", "Tres de Abril"],
  "Berón de Astrada": ["Berón de Astrada"],
  "Capital": ["Corrientes", "Riachuelo"],
  "Concepción": ["Concepción del Yaguareté Corá", "Santa Rosa", "Tabay", "Tatacuá"],
  "Curuzú Cuatiá": ["Cazadores Correntinos", "Curuzú Cuatiá", "Perugorría"],
  "Empedrado": ["El Sombrero", "Empedrado", "Manuel Derqui"],
  "Esquina": ["Esquina", "Malvinas", "Pueblo Libertador"],
  "General Alvear": ["Alvear", "Torrent"],
  "General Paz": ["Caá Catí", "Itá Ibaté", "Lomas de Vallejos", "Palmar Grande"],
  "Goya": ["Colonia Carolina", "Goya", "San Isidro"],
  "Itatí": ["Itatí", "Ramada Paso"],
  "Ituzaingó": ["Colonia Liebig", "Ituzaingó", "San Antonio de Apipé", "San Carlos", "Villa Olivari"],
  "Lavalle": ["Cecilio Echavarría", "Cruz de los Milagros", "Gobernador Martínez", "Lavalle", "Santa Lucía", "Yataytí Calle"],
  "Mburucuyá": ["Mburucuyá"],
  "Mercedes": ["Felipe Yofré", "Mariano I. Loza", "Mercedes"],
  "Monte Caseros": ["Colonia Libertad", "Juan Pujol", "Mocoretá", "Monte Caseros"],
  "Paso de los Libres": ["Bonpland", "Parada Pucheta", "Paso de los Libres", "Tapebicuá"],
  "Saladas": ["Pago de los Deseos", "Saladas", "San Lorenzo"],
  "San Cosme": ["Paso de la Patria", "San Cosme", "Santa Ana de los Guácaras"],
  "San Luis del Palmar": ["Herlitzka", "San Luis del Palmar"],
  "San Martín": ["Colonia Carlos Pellegrini", "Guaviraví", "La Cruz", "Yapeyú"],
  "San Miguel": ["El Caimán", "Loreto", "San Miguel"],
  "San Roque": ["9 de Julio", "Chavarría", "Colonia Pando", "Mantilla", "San Roque"],
  "Santo Tomé": ["Garaví", "Garruchos", "Gobernador Virasoro", "Santo Tomé"],
  "Sauce": ["Sauce"]
};

function inicializarCascadaDomicilio() {
  const selectPais = document.getElementById("domicilio_pais");
  if (!selectPais) return;

  // 1. Poblar países con Argentina preseleccionada
  selectPais.innerHTML = "";
  PAISES_MUNDO.sort((a, b) => a.localeCompare("es")).forEach((pais) => {
    const opt = document.createElement("option");
    opt.value = pais;
    opt.textContent = pais;
    if (pais === "Argentina") opt.selected = true;
    selectPais.appendChild(opt);
  });

  const contProv = document.getElementById("contenedor_provincia");
  const contDepto = document.getElementById("contenedor_depto");
  const contMuni = document.getElementById("contenedor_municipio");

  function configurarCamposSegunPais() {
    const esArg = selectPais.value === "Argentina";

    if (esArg) {
      contProv.innerHTML = `<label for="domicilio_provincia">Provincia *</label><select name="domicilio_provincia" id="domicilio_provincia" required></select>`;
      const selProv = document.getElementById("domicilio_provincia");

      PROVINCIAS_ARG.sort((a, b) => a.localeCompare("es")).forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        if (p === "Corrientes") opt.selected = true;
        selProv.appendChild(opt);
      });

      configurarCamposSegunProvincia();
      selProv.addEventListener("change", configurarCamposSegunProvincia);

    } else {
      contProv.innerHTML = `<label for="domicilio_provincia">Provincia / Estado / Región *</label><input type="text" name="domicilio_provincia" id="domicilio_provincia" required>`;
      contDepto.innerHTML = `<label for="domicilio_depto">Departamento / Condado *</label><input type="text" name="domicilio_depto" id="domicilio_depto" required>`;
      contMuni.innerHTML = `<label for="domicilio_municipio">Municipio / Ciudad *</label><input type="text" name="domicilio_municipio" id="domicilio_municipio" required>`;

      const sec3 = document.getElementById("sec-3");
      if (sec3) validarSeccion(sec3, "badge-sec-3");
    }
  }

  function configurarCamposSegunProvincia() {
    const selProv = document.getElementById("domicilio_provincia");
    const esCorrientes = selProv && selProv.value === "Corrientes";

    if (esCorrientes) {
      contDepto.innerHTML = `<label for="domicilio_depto">Departamento *</label><select name="domicilio_depto" id="domicilio_depto" required></select>`;
      const selDepto = document.getElementById("domicilio_depto");

      const optVacia = document.createElement("option");
      optVacia.value = "";
      optVacia.textContent = "Seleccionar...";
      selDepto.appendChild(optVacia);

      Object.keys(DEPTOS_Y_MUNICIPIOS_CORRIENTES).sort((a, b) => a.localeCompare("es")).forEach((depto) => {
        const opt = document.createElement("option");
        opt.value = depto;
        opt.textContent = depto;
        selDepto.appendChild(opt);
      });

      contMuni.innerHTML = `<label for="domicilio_municipio">Municipio *</label><select name="domicilio_municipio" id="domicilio_municipio" required><option value="">Elegir departamento primero...</option></select>`;
      const selMuni = document.getElementById("domicilio_municipio");

      selDepto.addEventListener("change", () => {
        const deptoElegido = selDepto.value;
        selMuni.innerHTML = "";

        if (deptoElegido && DEPTOS_Y_MUNICIPIOS_CORRIENTES[deptoElegido]) {
          const optDef = document.createElement("option");
          optDef.value = "";
          optDef.textContent = "Seleccionar...";
          selMuni.appendChild(optDef);

          DEPTOS_Y_MUNICIPIOS_CORRIENTES[deptoElegido].forEach((muni) => {
            const opt = document.createElement("option");
            opt.value = muni;
            opt.textContent = muni;
            selMuni.appendChild(opt);
          });
        } else {
          const optNone = document.createElement("option");
          optNone.value = "";
          optNone.textContent = "Elegir departamento primero...";
          selMuni.appendChild(optNone);
        }

        const sec3 = document.getElementById("sec-3");
        if (sec3) validarSeccion(sec3, "badge-sec-3");
      });

    } else {
      contDepto.innerHTML = `<label for="domicilio_depto">Departamento / Partido *</label><input type="text" name="domicilio_depto" id="domicilio_depto" required>`;
      contMuni.innerHTML = `<label for="domicilio_municipio">Municipio / Localidad *</label><input type="text" name="domicilio_municipio" id="domicilio_municipio" required>`;
    }

    const sec3 = document.getElementById("sec-3");
    if (sec3) validarSeccion(sec3, "badge-sec-3");
  }

  selectPais.addEventListener("change", configurarCamposSegunPais);
  configurarCamposSegunPais();
}

// ==============================================================================
// MAPEO OFICIAL CATASTRAL: DEPARTAMENTO + MUNICIPIO -> CÓDIGO DE PARTIDA
// ==============================================================================
const CODIGOS_CATASTRO_CORRIENTES = {
  "Alvear": { "Alvear": "T2", "Torrent": "T6", "Estación Torrent": "T6" },
  "General Alvear": { "Alvear": "T2", "Torrent": "T6", "Estación Torrent": "T6" },
  "Bella Vista": { "Bella Vista": "B1", "Tres de Abril": "B2" },
  "Berón de Astrada": { "Berón de Astrada": "C1" },
  "Capital": { "Capital": "A1", "Corrientes": "A1", "Riachuelo": "A2" },
  "Concepción": { "Concepción del Yaguareté Corá": "D1", "Concepción": "D1", "Tabay": "D2", "Santa Rosa": "D3", "Tatacuá": "D4" },
  "Curuzú Cuatiá": { "Curuzú Cuatiá": "E1", "Perugorría": "E2" },
  "Empedrado": { "Empedrado": "F1", "El Sombrero": "F2", "Manuel Derqui": "F1" },
  "Esquina": { "Esquina": "G1", "Pueblo Libertador": "G2", "Malvinas": "G1" },
  "General Paz": { "Caá Catí": "H1", "Itá Ibaté": "H2", "Lomas de Vallejos": "H3", "Palmar Grande": "H4" },
  "Goya": { "Goya": "I1", "Colonia Carolina": "I2", "San Isidro": "I3" },
  "Itatí": { "Itatí": "J1", "Ramada Paso": "J2" },
  "Ituzaingó": { "Ituzaingó": "K1", "San Carlos": "K2", "Colonia Liebig": "K3", "Villa Olivari": "K5", "Colonia San Antonio": "K6", "San Antonio de Apipé": "K6" },
  "Lavalle": { "Santa Lucía": "L1", "Gobernador Martínez": "L2", "Lavalle": "L4", "Cruz de los Milagros": "L5", "Yataytí Calle": "L7", "Cecilio Echavarría": "L4" },
  "Mburucuyá": { "Mburucuyá": "M1" },
  "Mercedes": { "Mercedes": "N1", "Felipe Yofré": "N2", "Mariano I. Loza": "N3" },
  "Monte Caseros": { "Monte Caseros": "O1", "Mocoretá": "O2", "Colonia Libertad": "O3", "Juan Pujol": "O4" },
  "Paso de los Libres": { "Paso de los Libres": "P1", "Bonpland": "P3", "Parada Pucheta": "P4", "Tapebicuá": "P5" },
  "Saladas": { "Saladas": "Q1", "San Lorenzo": "Q2", "Pago de los Deseos": "Q3" },
  "San Cosme": { "San Cosme": "R1", "Santa Ana de los Guácaras": "R2", "Santa Ana": "R2", "Paso de la Patria": "R3" },
  "San Luis del Palmar": { "San Luis del Palmar": "S1", "Herlitzka": "S2" },
  "San Martín": { "La Cruz": "T1", "Yapeyú": "T3", "Colonia Carlos Pellegrini": "T4", "Cnia. Carlos Pellegrini": "T4", "Guaviraví": "T5" },
  "San Miguel": { "San Miguel": "U1", "Loreto": "U2", "El Caimán": "U1" },
  "San Roque": { "Chavarría": "V1", "9 de Julio": "V2", "San Roque": "V3", "Mantilla": "V4", "Pedro R. Fernandez": "V4", "Colonia Pando": "V5" },
  "Santo Tomé": { "Santo Tomé": "W1", "Garruchos": "W2", "Garaví": "W2", "Gobernador Virasoro": "W3", "Jose R. Gomez": "W4" },
  "Sauce": { "Sauce": "X1" }
};

// ==============================================================================
// MAPEO OFICIAL SENASA RENSPA: DEPARTAMENTO -> CÓDIGO (04-XXX)
// ==============================================================================
const CODIGOS_RENSPA_CORRIENTES = {
  "Bella Vista": "001",
  "Berón de Astrada": "002",
  "Capital": "003",
  "Concepción": "004",
  "Curuzú Cuatiá": "005",
  "Empedrado": "006",
  "Esquina": "007",
  "General Alvear": "008",
  "Alvear": "008",
  "General Paz": "009",
  "Goya": "010",
  "Itatí": "011",
  "Ituzaingó": "012",
  "Lavalle": "013",
  "Mburucuyá": "014",
  "Mercedes": "015",
  "Monte Caseros": "016",
  "Paso de los Libres": "017",
  "Saladas": "018",
  "San Cosme": "019",
  "San Luis del Palmar": "020",
  "San Martín": "021",
  "San Miguel": "022",
  "San Roque": "023",
  "Santo Tomé": "024",
  "Sauce": "025"
};

// ==============================================================================
// 7. SECCIÓN PREDIO, TENENCIA Y MÁSCARAS ESTRICTAS (PARTIDAS ADREMA Y RENSPA)
// ==============================================================================
function inicializarPredioYTenencia() {
  const selDepto = document.getElementById("departamento");
  const selMuni = document.getElementById("municipio");
  const contenedorPartidas = document.getElementById("contenedorPartidas");
  const btnAgregar = document.getElementById("btnAgregarPartida");
  const inputRenspa = document.getElementById("renspa");

  // Obtiene el prefijo oficial Adrema (ej: "Q1") según depto y municipio
  function obtenerPrefijoActual() {
    const depto = selDepto ? selDepto.value : "";
    const muni = selMuni ? selMuni.value : "";
    if (depto && muni && CODIGOS_CATASTRO_CORRIENTES[depto] && CODIGOS_CATASTRO_CORRIENTES[depto][muni]) {
      return CODIGOS_CATASTRO_CORRIENTES[depto][muni];
    }
    return "";
  }

  // Obtiene el prefijo oficial SENASA (ej: "04.004.") según el departamento
  function obtenerPrefijoRenspaActual() {
    const depto = selDepto ? selDepto.value : "";
    if (depto && CODIGOS_RENSPA_CORRIENTES[depto]) {
      return `04.${CODIGOS_RENSPA_CORRIENTES[depto]}.`;
    }
    return "";
  }

  // Aplica la máscara estricta: [Prefijo] [6 dígitos]-[1|2|3]
  function aplicarMascaraPartida(input) {
    input.setAttribute("maxlength", "11");
    input.setAttribute("placeholder", "Ej: Q1 242432-1");
    input.setAttribute("pattern", "^[A-ZÑa-zñ]\\d\\s\\d{6}-[1-3]$");

    input.addEventListener("input", (e) => {
      let val = e.target.value;
      const prefijo = obtenerPrefijoActual();

      if (prefijo) {
        let soloNumeros = val.toUpperCase().replace(prefijo, "").replace(/\D/g, "");
        let resultado = prefijo;

        if (soloNumeros.length > 0) {
          resultado += " " + soloNumeros.slice(0, 6);
        }

        if (soloNumeros.length >= 7) {
          const digitoFinal = soloNumeros.charAt(6);
          if (["1", "2", "3"].includes(digitoFinal)) {
            resultado += "-" + digitoFinal;
          }
        }

        e.target.value = resultado;
      } else {
        let primerLetra = val.charAt(0).toUpperCase();
        if (!/[A-ZÑ]/.test(primerLetra)) {
          e.target.value = "";
          return;
        }

        let resto = val.slice(1).replace(/\D/g, "");
        let resultado = primerLetra;

        if (resto.length > 0) resultado += resto.charAt(0);
        if (resto.length > 1) resultado += " " + resto.slice(1, 7);
        if (resto.length >= 8) {
          const digVerif = resto.charAt(7);
          if (["1", "2", "3"].includes(digVerif)) {
            resultado += "-" + digVerif;
          }
        }
        e.target.value = resultado;
      }

      const sec4 = document.getElementById("sec-4");
      if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
    });
  }

  // Actualiza los inputs de partida existentes cuando cambia el municipio o depto
  function actualizarPrefijoEnPartidas() {
    const prefijo = obtenerPrefijoActual();
    if (!prefijo) return;

    const inputs = contenedorPartidas.querySelectorAll(".input-partida");
    inputs.forEach((input) => {
      let val = input.value.trim();
      let sinPrefijo = val.replace(/^[A-ZÑ]\d\s*/i, "").trim();
      let match = sinPrefijo.match(/^(\d{1,6})(?:-([1-3]))?$/);

      if (match && match[1]) {
        let numeros = match[1];
        let digito = match[2] ? `-${match[2]}` : "";
        input.value = `${prefijo} ${numeros}${digito}`;
      } else {
        input.value = `${prefijo} `;
      }
    });

    const sec4 = document.getElementById("sec-4");
    if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
  }

  // Formateador estricto para RENSPA (04.XXX.X.XXXXX/XX)
  function formatearRenspa(valorNumerico, codigoDepto) {
    let num = valorNumerico.replace(/\D/g, "");

    // Si hay código de depto seleccionado, forzamos que arranque con 04 + código
    if (codigoDepto) {
      const prefijoFijo = "04" + codigoDepto;
      if (num.startsWith(prefijoFijo)) {
        num = prefijoFijo + num.slice(prefijoFijo.length);
      } else if (num.startsWith("04")) {
        num = prefijoFijo + num.slice(2).replace(new RegExp("^" + codigoDepto), "");
      } else {
        num = prefijoFijo + num;
      }
    }

    if (num.length > 13) num = num.slice(0, 13);

    let res = "";
    if (num.length > 0) res += num.slice(0, 2);
    if (num.length > 2) res += "." + num.slice(2, 5);
    if (num.length > 5) res += "." + num.slice(5, 6);
    if (num.length > 6) res += "." + num.slice(6, 11);
    if (num.length > 11) res += "/" + num.slice(11, 13);

    return res;
  }

  // Actualiza el RENSPA al cambiar el departamento sin romper ni agregar dígitos
  function actualizarPrefijoRenspa() {
    if (!inputRenspa) return;
    const depto = selDepto ? selDepto.value : "";
    const codigoDepto = CODIGOS_RENSPA_CORRIENTES[depto] || "";
    if (!codigoDepto) return;

    let v = inputRenspa.value.replace(/\D/g, "");
    // Si ya tenía números ingresados más allá del prefijo (más de 5 dígitos), conservamos solo el resto
    let resto = v.length > 5 ? v.slice(5) : "";

    // Si no había resto, que quede exactamente "04.XXX." para que el productor empiece a tipear
    if (!resto) {
      inputRenspa.value = `04.${codigoDepto}.`;
    } else {
      inputRenspa.value = formatearRenspa("04" + codigoDepto + resto, codigoDepto);
    }

    const sec4 = document.getElementById("sec-4");
    if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
  }

  // Máscara automática y validación de formato para RENSPA
  if (inputRenspa) {
    inputRenspa.setAttribute("maxlength", "17");
    inputRenspa.setAttribute("placeholder", "04.000.0.00000/00");
    inputRenspa.setAttribute("pattern", "^04\\.\\d{3}\\.\\d{1}\\.\\d{5}\\/\\d{2}$");

    inputRenspa.addEventListener("input", (e) => {
      const depto = selDepto ? selDepto.value : "";
      const codigoDepto = CODIGOS_RENSPA_CORRIENTES[depto] || "";

      let formateado = formatearRenspa(e.target.value, codigoDepto);

      // Si solo tiene el prefijo de 5 números (04XXX), le agregamos el punto al final para comodidad
      if (codigoDepto && formateado === `04.${codigoDepto}`) {
        formateado = `04.${codigoDepto}.`;
      }

      e.target.value = formateado;

      const sec4 = document.getElementById("sec-4");
      if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
    });
  }

  // Inicializar máscara en la primera fila de partida
  const primerInputPartida = document.querySelector(".input-partida");
  if (primerInputPartida) {
    aplicarMascaraPartida(primerInputPartida);
  }

  // Cascada de Departamento y Municipio del Predio
  if (selDepto && selMuni && typeof DEPTOS_Y_MUNICIPIOS_CORRIENTES !== "undefined") {
    selDepto.innerHTML = `<option value="">Seleccionar departamento...</option>`;
    Object.keys(DEPTOS_Y_MUNICIPIOS_CORRIENTES).sort((a, b) => a.localeCompare("es")).forEach((depto) => {
      const opt = document.createElement("option");
      opt.value = depto;
      opt.textContent = depto;
      selDepto.appendChild(opt);
    });

    selDepto.addEventListener("change", () => {
      const deptoElegido = selDepto.value;
      selMuni.innerHTML = "";

      if (deptoElegido && DEPTOS_Y_MUNICIPIOS_CORRIENTES[deptoElegido]) {
        const optDef = document.createElement("option");
        optDef.value = "";
        optDef.textContent = "Seleccionar municipio...";
        selMuni.appendChild(optDef);

        DEPTOS_Y_MUNICIPIOS_CORRIENTES[deptoElegido].forEach((muni) => {
          const opt = document.createElement("option");
          opt.value = muni;
          opt.textContent = muni;
          selMuni.appendChild(opt);
        });
      } else {
        const optNone = document.createElement("option");
        optNone.value = "";
        optNone.textContent = "Elegir departamento primero...";
        selMuni.appendChild(optNone);
      }

      actualizarPrefijoEnPartidas();
      actualizarPrefijoRenspa();
    });

    selMuni.addEventListener("change", () => {
      actualizarPrefijoEnPartidas();
    });
  }

  // Manejo dinámico de Partidas y Tenencia con etiqueta (Adrema)
  if (btnAgregar && contenedorPartidas) {
    const opcionesTenenciaHTML = `
      <option value="">Seleccionar...</option>
      <option value="P — Propietario">P — Propietario</option>
      <option value="S — Sucesión indivisa">S — Sucesión indivisa</option>
      <option value="A — Arrendatario">A — Arrendatario</option>
      <option value="AP — Aparcería">AP — Aparcería</option>
      <option value="CA — Contrato accidental">CA — Contrato accidental</option>
      <option value="OP — Ocupación con permiso">OP — Ocupación con permiso</option>
      <option value="OH — Ocupación de hecho">OH — Ocupación de hecho</option>
      <option value="OG — Ocupación gratuita">OG — Ocupación gratuita</option>
      <option value="O — Otros">O — Otros</option>
    `;

    function actualizarNumeracionPartidas() {
      const bloques = contenedorPartidas.querySelectorAll(".item-bloque-partida");
      bloques.forEach((bloque, idx) => {
        const num = idx + 1;
        bloque.setAttribute("data-partida-index", num);
        const lblTenencia = bloque.querySelector(".label-tenencia-dinamica");
        if (lblTenencia) {
          lblTenencia.textContent = `Tenencia de la partida ${num}`;
        }
      });
    }

    btnAgregar.addEventListener("click", () => {
      const totalActual = contenedorPartidas.querySelectorAll(".item-bloque-partida").length;
      const nuevoIndice = totalActual + 1;
      const prefijo = obtenerPrefijoActual();

      const filaExtra = document.createElement("div");
      filaExtra.className = "item-bloque-partida item-bloque-partida-extra";
      filaExtra.setAttribute("data-partida-index", nuevoIndice);
      filaExtra.innerHTML = `
        <div class="grid-partida-superficie">
          <div class="input-group">
            <label>Número de partida (Adrema)</label>
            <input type="text" name="partida_numero[]" class="input-partida" value="${prefijo ? prefijo + ' ' : ''}" pattern="^[A-ZÑa-zñ]\\d\\s\\d{6}-[1-3]$" required>
          </div>
          <div class="input-group">
            <label>Superficie (ha)</label>
            <input type="number" step="any" name="partida_superficie[]" class="input-superficie" required>
          </div>
        </div>

        <div class="input-group">
          <label class="label-tenencia-dinamica">Tenencia de la partida ${nuevoIndice}</label>
          <select name="partida_tenencia[]" class="select-tenencia" required>
            ${opcionesTenenciaHTML}
          </select>
        </div>

        <div class="quitar-partida-row">
          <button type="button" class="btn-quitar-map">Quitar</button>
        </div>
      `;

      const inputNuevo = filaExtra.querySelector(".input-partida");
      if (inputNuevo) {
        aplicarMascaraPartida(inputNuevo);
      }

      filaExtra.querySelector(".btn-quitar-map").addEventListener("click", () => {
        filaExtra.remove();
        actualizarNumeracionPartidas();
        const sec4 = document.getElementById("sec-4");
        if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
      });

      contenedorPartidas.appendChild(filaExtra);

      const sec4 = document.getElementById("sec-4");
      if (sec4 && typeof validarSeccion === "function") validarSeccion(sec4, "badge-sec-4");
    });
  }

}

// ==============================================================================
// 8. RESTRICCIONES Y VALIDACIONES SEMÁNTICAS GLOBALES
// ==============================================================================

// Algoritmo oficial AFIP Módulo 11 para CUIT/CUIL
function validarAlgoritmoCUIT(cuitLimpio) {
  if (!/^\d{11}$/.test(cuitLimpio)) return false;

  const prefijosValidos = ["20", "23", "24", "27", "30", "33", "34"];
  if (!prefijosValidos.includes(cuitLimpio.slice(0, 2))) return false;

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuitLimpio.charAt(i), 10) * multiplicadores[i];
  }

  let digitoCalculado = 11 - (suma % 11);
  if (digitoCalculado === 11) digitoCalculado = 0;
  if (digitoCalculado === 10) digitoCalculado = 9;

  return digitoCalculado === parseInt(cuitLimpio.charAt(10), 10);
}

// Validación de Correo Electrónico
function validarFormatoEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase().trim());
}

// Validación de Teléfono (Argentina)
function validarFormatoTelefono(tel) {
  const soloNumeros = tel.replace(/\D/g, "");
  return soloNumeros.length >= 8 && soloNumeros.length <= 13;
}

// Inicialización de restricciones y filtros en tiempo real
function inicializarRestriccionesCampos() {
  const inputsDni = document.querySelectorAll("#num_doc, [name='num_doc']");
  const inputsTelefono = document.querySelectorAll("input[type='tel'], #telefono1, #telefono2, [name='telefono1'], [name='telefono2']");
  const inputsTextoNombre = document.querySelectorAll("#productor_fisica, #declarante_juridica, #razon_social, #caracter_otro, [name='productor_fisica'], [name='declarante_juridica'], [name='razon_social']");
  const inputsSuperficie = document.querySelectorAll("input[type='number'], .input-superficie, #sup_arroz, #sup_sembrada, #sup_regada");

  // DNI: Solo números (7 u 8 dígitos)
  inputsDni.forEach((input) => {
    input.setAttribute("maxlength", "8");
    input.setAttribute("inputmode", "numeric");
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
    });
  });

  // Teléfonos: Solo dígitos, espacios, guiones y '+' al comienzo
  inputsTelefono.forEach((input) => {
    input.setAttribute("maxlength", "18");
    input.setAttribute("inputmode", "tel");
    input.addEventListener("input", (e) => {
      let val = e.target.value;
      let tieneMas = val.startsWith("+");
      let limpio = val.replace(/[^\d\s-]/g, "");
      e.target.value = (tieneMas ? "+" : "") + limpio.replace(/^\+/, "");
    });
  });

  // Nombres y Razón Social: Bloqueo de caracteres numéricos o símbolos extraños no corporativos
  inputsTextoNombre.forEach((input) => {
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,&'-]/g, "");
    });
  });

  // Superficies y Hectáreas: Previene números negativos
  inputsSuperficie.forEach((input) => {
    input.addEventListener("input", (e) => {
      if (parseFloat(e.target.value) < 0) {
        e.target.value = "";
      }
    });
  });
}
