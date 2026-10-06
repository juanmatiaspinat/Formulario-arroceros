// URL DEL APPS SCRIPT QUE PUBLICASTE
const SCRIPT_URL = "PEGAR_ACA_LA_URL_DE_TU_APPS_SCRIPT";

let registrosGlobales = [];

async function cargarDeclaraciones() {
  const tbody = document.getElementById("tablaBody");
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Cargando datos desde la planilla...</td></tr>';

  try {
    const res = await fetch(SCRIPT_URL);
    const json = await res.json();

    if (json.status === "success" && json.data) {
      registrosGlobales = json.data;
      poblarFiltroDepartamentos(registrosGlobales);
      renderizarTabla(registrosGlobales);
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">No hay registros cargados aún.</td></tr>';
    }
  } catch (err) {
    console.error("Error al cargar:", err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error al consultar los datos. Verificá la URL del script.</td></tr>';
  }
}

function renderizarTabla(datos) {
  const tbody = document.getElementById("tablaBody");
  const stat = document.getElementById("statTotal");
  stat.innerText = `${datos.length} declaraciones`;

  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No se encontraron declaraciones con esos criterios.</td></tr>';
    return;
  }

  tbody.innerHTML = datos.map(r => {
    const linkPdf = r["Link PDF Drive"] || "";
    const botonPdf = linkPdf 
      ? `<a href="${linkPdf}" target="_blank" class="btn-pdf">📄 Ver PDF</a>`
      : `<span style="color:#94a3b8;">Sin archivo</span>`;

    return `
      <tr>
        <td><strong>${r["ID Comprobante"] || "-"}</strong></td>
        <td>${r["Fecha y Hora"] ? r["Fecha y Hora"].slice(0, 16) : "-"}</td>
        <td>${r["Apellido y Nombre"] || "-"}</td>
        <td>${r["CUIT/CUIL"] || "-"}</td>
        <td>${r["Departamento"] || "-"}</td>
        <td>${r["Sup. Arroz (Ha)"] || "0"} ha</td>
        <td>${botonPdf}</td>
      </tr>
    `;
  }).join("");
}

function poblarFiltroDepartamentos(datos) {
  const select = document.getElementById("filtroDepto");
  const deptos = Array.from(new Set(datos.map(d => d["Departamento"]).filter(Boolean))).sort();
  
  select.innerHTML = '<option value="">Todos los Departamentos</option>' + 
    deptos.map(d => `<option value="${d}">${d}</option>`).join("");
}

// Buscador en tiempo real
function aplicarFiltros() {
  const texto = document.getElementById("buscador").value.toLowerCase().trim();
  const depto = document.getElementById("filtroDepto").value;

  const filtrados = registrosGlobales.filter(r => {
    const prod = (r["Apellido y Nombre"] || "").toLowerCase();
    const cuit = (r["CUIT/CUIL"] || "").toLowerCase();
    const comp = (r["ID Comprobante"] || "").toLowerCase();
    const dep = r["Departamento"] || "";

    const coincideTexto = prod.includes(texto) || cuit.includes(texto) || comp.includes(texto);
    const coincideDepto = depto === "" || dep === depto;

    return coincideTexto && coincideDepto;
  });

  renderizarTabla(filtrados);
}

document.getElementById("buscador").addEventListener("input", aplicarFiltros);
document.getElementById("filtroDepto").addEventListener("change", aplicarFiltros);
document.getElementById("btnRecargar").addEventListener("click", cargarDeclaraciones);

// Inicia al cargar
document.addEventListener("DOMContentLoaded", cargarDeclaraciones);
