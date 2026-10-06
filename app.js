// URL DEL APPS SCRIPT QUE PUBLICASTE
const SCRIPT_URL = "PEGAR_ACA_LA_URL_DE_TU_APPS_SCRIPT";

// ==============================================================================
// 1. MAPA LEAFLET OFICIAL (ESRI SATÉLITE + MAPA IGN + DIBUJO ILIMITADO Y GPS)
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
  // Centro geográfico de Corrientes
  map = L.map("mapaLote").setView([-28.5, -57.8], 7);

  // Capa Satelital
  capaSatelite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 18
  }).addTo(map);

  // Capa IGN / Calles
  capaIGN = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Instituto Geográfico Nacional / OSM",
    maxZoom: 18
  });

  // Selector de capas Satélite / IGN
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

  // Botón: Dibujar el lote
  document.getElementById("btnDibujarLote").addEventListener("click", () => {
    iniciarModoDibujo();
  });

  // Clic en el mapa para marcar vértices continuos
  map.on("click", (e) => {
    if (modoDibujoActivo) {
      agregarVertice(e.latlng.lat, e.latlng.lng);
    }
  });

  // Doble clic: cierre alternativo del polígono si ya tiene al menos 3 puntos
  map.on("dblclick", (e) => {
    if (modoDibujoActivo && puntosLote.length >= 3) {
      cerrarPoligono();
    }
  });

  // Botón "Detectar mi ubicación": SOLO POSICIONA EN EL MAPA SIN DIBUJAR NADA
  document.getElementById("btnDetectarUbicacion").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Vuela suavemente a la ubicación actual con zoom 16
        map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });

        // Marcador visual azul para indicar dónde está el usuario
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

  // Botón "Cargar coordenadas"
  document.getElementById("btnAbrirCargarCoords").addEventListener("click", () => {
    const caja = document.getElementById("cajaCargarCoords");
    caja.style.display = caja.style.display === "none" ? "block" : "none";
  });

  document.getElementById("btnCancelarCoords").addEventListener("click", () => {
    document.getElementById("cajaCargarCoords").style.display = "none";
  });

  // Dibujar desde caja de texto de coordenadas
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

  // Botones para borrar / limpiar
  document.getElementById("btnBorrarDibujo").addEventListener("click", limpiarTodoElMapa);
  document.getElementById("btnQuitarTodo").addEventListener("click", limpiarTodoElMapa);

  // Botón: Ajustar esquinas
  document.getElementById("btnAjustarEsquinas").addEventListener("click", () => {
    activarVerticesArrastrables();
  });
});

function iniciarModoDibujo() {
  limpiarTodoElMapa();
  modoDibujoActivo = true;
  document.getElementById("mapaInstruccion").innerText = "Hacé clic en el mapa para marcar las esquinas. Tocá el primer punto (círculo verde) para cerrar el lote.";
}

function agregarVertice(lat, lng) {
  // Si ya tenemos al menos 3 puntos y el usuario hace clic muy cerca del primer punto -> cierra el polígono
  if (puntosLote.length >= 3) {
    const primerPunto = puntosLote[0];
    const distancia = map.distance([lat, lng], primerPunto); // distancia en metros
    if (distancia < 25) { // 25 metros de tolerancia de clic
      cerrarPoligono();
      return;
    }
  }

  puntosLote.push([lat, lng]);

  const esPrimerPunto = puntosLote.length === 1;

  // Marcador del vértice: el primero resalta para indicar dónde cerrar
  const marker = L.circleMarker([lat, lng], {
    radius: esPrimerPunto ? 7 : 5,
    color: esPrimerPunto ? "#15803d" : "#f59e0b",
    fillColor: esPrimerPunto ? "#22c55e" : "#fbbf24",
    fillOpacity: 1,
    weight: esPrimerPunto ? 3 : 2
  }).addTo(map);

  // Al hacer clic directo sobre el primer punto se cierra
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

  // Trazar la línea temporal de dibujo
  if (polylineTemporal) map.removeLayer(polylineTemporal);
  polylineTemporal = L.polyline(puntosLote, {
    color: "#f59e0b",
    weight: 2,
    dashArray: "4, 4"
  }).addTo(map);
}

function cerrarPoligono(hectareasForzadas) {
  modoDibujoActivo = false;

  if (polylineTemporal) {
    map.removeLayer(polylineTemporal);
    polylineTemporal = null;
  }
  if (polygonLayer) map.removeLayer(polygonLayer);
  marcadoresVertices.forEach(m => map.removeLayer(m));
  marcadoresVertices = [];

  // Polígono final amarillo oficial
  polygonLayer = L.polygon(puntosLote, {
    color: "#fbbf24",
    weight: 3,
    fillColor: "#fef08a",
    fillOpacity: 0.3
  }).addTo(map);

  map.fitBounds(polygonLayer.getBounds(), { padding: [30, 30] });

  // Calcular superficie
  const ha = hectareasForzadas || calcularHectareas(puntosLote);
  document.getElementById("txtHectareasCalc").innerText = `· ${ha.toFixed(1).replace(".", ",")} ha de referencia`;

  // Cambiar barra de botones a lote dibujado
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

// 2. FORMATEO DE CUIT CON GUIONES
const inputCuit = document.getElementById("cuit");
if (inputCuit) {
  inputCuit.addEventListener("input", (e) => {
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
}

// 3. GENERADOR SILENCIOSO DE PDF EN MEMORIA
function generarPdfEnMemoria(data, numComprobante, fechaHoraStr) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Encabezado
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

  // Metadatos
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(46, 45, 44);
  doc.text(`Comprobante N°: ${numComprobante}`, 14, 37);
  doc.text(`Fecha y Hora: ${fechaHoraStr}`, 130, 37);

  // Tabla 1: Productor
  doc.autoTable({
    startY: 40,
    head: [["1. DATOS DEL PRODUCTOR Y CONTACTO", "DETALLE"]],
    body: [
      ["Apellido y Nombre / Razón Social", data.productor],
      ["Tipo de Persona", data.tipo_persona],
      ["Declara Por", data.declara_por],
      ["Documento", `${data.tipo_doc}: ${data.num_doc}`],
      ["CUIT / CUIL", data.cuit],
      ["Teléfonos", `${data.telefono1} ${data.telefono2 ? "/ " + data.telefono2 : ""}`],
      ["Correo Electrónico", data.email],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } }
  });

  // Tabla 2: Domicilio Legal / Particular
  const domDetalle = `${data.domicilio_calle || ""}, Barrio: ${data.domicilio_barrio || "-"}, CP: ${data.domicilio_cp || "-"}`;
  const locDetalle = `${data.domicilio_municipio || ""}, Depto: ${data.domicilio_depto || ""}, ${data.domicilio_provincia || "Corrientes"}`;

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 3,
    head: [["2. DOMICILIO (PARTICULAR O LEGAL)", "DETALLE"]],
    body: [
      ["Tipo de Domicilio", data.domicilio_tipo || "Particular"],
      ["Dirección / Calle", domDetalle],
      ["Localidad y Departamento", locDetalle],
      ["Paraje / Sección", `${data.domicilio_paraje || "-"} / ${data.domicilio_seccion || "-"}`],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } }
  });

  // Tabla 3: Predio y Producción
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 3,
    head: [["3. PREDIO Y PRODUCCIÓN ARROCERA", "VALOR"]],
    body: [
      ["Departamento / Municipio", `${data.departamento} / ${data.municipio}`],
      ["N° Partida Inmobiliaria", data.partida],
      ["Tenencia de la Partida", data.tenencia],
      ["RENSPA", data.renspa],
      ["Superficie Total Arroz (Ha)", `${data.sup_arroz} ha`],
      ["Superficie Sembrada / Regada (Ha)", `${data.sup_sembrada} ha / ${data.sup_regada} ha`],
      ["Fecha Inicio Siembra / Campaña", `${data.fecha_siembra} (Campaña ${data.campana})`],
      ["Coordenadas del Lote (GPS)", data.coordenadas_lote || "No informadas en mapa"],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 86, 143], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } }
  });

  // Texto Legal
  const yLegal = doc.lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 53, 15);
  const textoLegal = "DECLARO BAJO JURAMENTO QUE LOS DATOS CONSIGNADOS PRECEDENTEMENTE SON VERACES Y REFLEJAN LA REALIDAD DEL ESTABLECIMIENTO. ASUMO CONOCER LAS SANCIONES ESPECIFICADAS POR LA LEY QUE ME CORRESPONDE EN CASO DE VERIFICARSE FALSEDAD EN LOS DATOS (ART. 292 Y 293 CÓDIGO PENAL DE LA NACIÓN).";
  doc.text(textoLegal, 14, yLegal, { maxWidth: 182 });

  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}

// 4. SUBMIT DEL FORMULARIO
document.getElementById("arrozForm").addEventListener("submit", async (e) => {
  e.preventDefault();

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
