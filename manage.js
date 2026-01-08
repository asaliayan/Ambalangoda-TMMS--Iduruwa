let electricalData = [];

// Load data from the API
async function loadData() {
  try {
    const response = await fetch("/api/records");
    if (!response.ok) throw new Error("Failed to load data");
    electricalData = await response.json();
    displayRecords(electricalData);
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load data. Please check the console for details.");
  }
}

// Helper function to get form data
function getFormData() {
  return {
    SIN: document.getElementById("sin").value,
    "Feeder Id": document.getElementById("feeder-id").value,
    "Substation Name": document.getElementById("substation-name").value,
    Type: document.getElementById("type").value,
    Capacity: document.getElementById("capacity").value,
    kV: document.getElementById("kv").value,
    LastMaintenanceDate: document.getElementById("last-maintenance-date").value,
    NextMaintenanceDate: calculateNextMaintenanceDate(
      document.getElementById("last-maintenance-date").value,
      document.getElementById("cycle").value
    ),
    SurgeArResistance: document.getElementById("surge-ar-resistance").value,
    NutrelResistance: document.getElementById("nutrel-resistance").value,
    Cycle: document.getElementById("cycle").value,
    IR_HT_LT: document.getElementById("ir-ht-lt").value || null,
    IR_HT_BODY: document.getElementById("ir-ht-body").value || null,
    IR_LT_BODY: document.getElementById("ir-lt-body").value || null,
    new_sub: document.getElementById("new-sub").value === "true",
  };
}

// Add a new record
async function addRecord(event) {
  event.preventDefault();

  const newRecord = getFormData();

  const sinExists = electricalData.some(
    (record) => record.SIN === newRecord.SIN
  );
  if (sinExists) {
    alert("A record with this SIN already exists. Please use a unique SIN.");
    return;
  }

  try {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    });

    if (!response.ok) throw new Error("Failed to add record");

    await loadData();
    clearForm();
  } catch (error) {
    console.error("Error adding record:", error);
    alert("Failed to add record. Please check the console for details.");
  }
}

// Update a record
async function updateRecord(sin) {
  const record = electricalData.find((item) => item.SIN === sin);
  document.getElementById("record-id").value = sin;
  document.getElementById("sin").value = record.SIN;
  document.getElementById("feeder-id").value = record["Feeder Id"];
  document.getElementById("substation-name").value = record["Substation Name"];
  document.getElementById("type").value = record.Type;
  document.getElementById("capacity").value = record.Capacity;
  document.getElementById("kv").value = record.kV;
  document.getElementById("last-maintenance-date").value =
    record.LastMaintenanceDate;
  document.getElementById("cycle").value = record.Cycle;
  document.getElementById("surge-ar-resistance").value =
    record.SurgeArResistance || "";
  document.getElementById("nutrel-resistance").value =
    record.NutrelResistance || "";
  document.getElementById("ir-ht-lt").value = record.IR_HT_LT || "";
  document.getElementById("ir-ht-body").value = record.IR_HT_BODY || "";
  document.getElementById("ir-lt-body").value = record.IR_LT_BODY || "";
  document.getElementById("new-sub").value = record.new_sub ? "true" : "false";

  // Change subtitle to "Update Data"
  document.getElementById("form-subtitle").textContent = "Update Data";
}

// Save updated record
async function saveUpdatedRecord() {
  const sin = document.getElementById("record-id").value;
  const updatedRecord = getFormData();

  try {
    const response = await fetch(`/api/records/${sin}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRecord),
    });

    if (!response.ok) throw new Error("Failed to update record");

    await loadData();
    clearForm();
  } catch (error) {
    console.error("Error updating record:", error);
    alert("Failed to update record. Please check the console for details.");
  }
}

// Delete a record
async function deleteRecord(sin) {
  try {
    const response = await fetch(`/api/records/${sin}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete record");

    await loadData();
    clearForm();
  } catch (error) {
    console.error("Error deleting record:", error);
    alert("Failed to delete record. Please check the console for details.");
  }
}

// Clear the form
function clearForm() {
  document.getElementById("record-form").reset();
  document.getElementById("record-id").value = "";
  document.getElementById("sin").value = "I";
  document.getElementById("new-sub").value = "false";
  // Reset subtitle to "Add New Data"
  document.getElementById("form-subtitle").textContent = "Add New Data";
}

// Search by SIN
function searchBySIN() {
  const searchTerm = document
    .getElementById("search-sin")
    .value.trim()
    .toUpperCase();
  const matchingRecords = electricalData.filter(
    (item) => item.SIN.toUpperCase() === searchTerm
  );
  displayRecords(matchingRecords);
  document.getElementById("search-sin").value = "I";
}

// Calculate next maintenance date
function calculateNextMaintenanceDate(lastMaintenanceDate, cycle) {
  if (!lastMaintenanceDate) return null;
  const lastDate = new Date(lastMaintenanceDate);
  const nextDate = new Date(
    lastDate.getTime() + cycle * 365 * 24 * 60 * 60 * 1000
  );
  return nextDate.toISOString().split("T")[0];
}

// Display records in the table
function displayRecords(records) {
  const tbody = document.querySelector("#records-table tbody");
  tbody.innerHTML = "";
  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.SIN}</td>
      <td>${record["Feeder Id"]}</td>
      <td>${record["Substation Name"]}</td>
      <td>${record.Type}</td>
      <td>${record.Capacity} kVA</td>
      <td>${record.kV}</td>
      <td>${formatDate(record.LastMaintenanceDate)}</td>
      <td>${formatDate(record.NextMaintenanceDate)}</td>
      <td>${record.SurgeArResistance || "N/A"}</td>
      <td>${record.NutrelResistance || "N/A"}</td>
      <td>${record.IR_HT_LT || "N/A"}</td>
      <td>${record.IR_HT_BODY || "N/A"}</td>
      <td>${record.IR_LT_BODY || "N/A"}</td>
      <td>${record.new_sub ? "Yes" : "No"}</td>
      <td>
        <button class="btn btn-warning edit-btn" data-sin="${
          record.SIN
        }">Edit</button>
        <button class="btn btn-danger delete-btn" data-sin="${
          record.SIN
        }">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  setTimeout(syncFloatingScrollbar, 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Sync floating scrollbar with table scroll
function syncFloatingScrollbar() {
  const tableContainer = document.querySelector(".table-container");
  const table = document.querySelector("#records-table");
  const floatingScrollbar = document.getElementById("floating-scrollbar");

  // if (!table || !floatingScrollbar) {
  //   console.error("Table or floating scrollbar not found");
  //   return;
  // }

  // floatingScrollbar.innerHTML =
  //   '<div style="width: ' + table.scrollWidth + 'px; height: 1px;"></div>';
  // floatingScrollbar.scrollLeft = tableContainer.scrollLeft;

  // tableContainer.onscroll = () => {
  //   floatingScrollbar.scrollLeft = tableContainer.scrollLeft;
  // };

  // floatingScrollbar.onscroll = () => {
  //   tableContainer.scrollLeft = floatingScrollbar.scrollLeft;
  // };
}

// Event Listeners
document.getElementById("record-form").addEventListener("submit", addRecord);
document.getElementById("search-btn").addEventListener("click", searchBySIN);
document
  .getElementById("update-btn")
  .addEventListener("click", saveUpdatedRecord);
document.getElementById("delete-btn").addEventListener("click", () => {
  const sin = document.getElementById("record-id").value;
  if (sin) {
    const confirmDelete = confirm(
      `Are you sure you want to delete this ${sin} record?`
    );
    if (confirmDelete) deleteRecord(sin);
  }
});

document
  .querySelector("#records-table tbody")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("edit-btn")) {
      const sin = event.target.getAttribute("data-sin");
      updateRecord(sin);
    } else if (event.target.classList.contains("delete-btn")) {
      const sin = event.target.getAttribute("data-sin");
      const confirmDelete = confirm(
        `Are you sure you want to delete this ${sin} record?`
      );
      if (confirmDelete) deleteRecord(sin);
    }
  });

document.getElementById("cancel-btn").addEventListener("click", clearForm);

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});
