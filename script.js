let electricalData = [];
let currentFilteredResults = [];

// Load data from the API
async function loadData() {
  try {
    const response = await fetch("/api/records");
    if (!response.ok) throw new Error("Failed to load data");
    electricalData = await response.json();
    updateSummaryStats();
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load data. Please check the console for details.");
  }
}

// Display records in the results section
function displayRecord(record, index) {
  const today = new Date();
  const nextMaintenanceDate = record.NextMaintenanceDate
    ? new Date(record.NextMaintenanceDate)
    : null;

  let maintenanceStatus = "";
  if (!nextMaintenanceDate) {
    maintenanceStatus =
      '<strong style="color: red;">Status: Never maintained</strong>';
  } else {
    const timeDifference = nextMaintenanceDate - today;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    if (daysDifference < 0) {
      maintenanceStatus = `<strong style="color: red;">Status: Overdue by ${Math.abs(
        daysDifference
      )} days</strong>`;
    } else {
      maintenanceStatus = `<strong style="color: green;">Status: Due in ${daysDifference} days</strong>`;
    }
  }

  const resultItem = document.createElement("div");
  resultItem.classList.add("result-item");
  const numberDisplay = index ? `<span class="number">${index}.</span>` : "";

  resultItem.innerHTML = `
    ${numberDisplay} <br>
    <strong>SIN:</strong> ${record.SIN}<br>
    <strong>Feeder Id:</strong> ${record["Feeder Id"]}<br>
    <strong>Substation Name:</strong> ${record["Substation Name"]}<br>
    <strong>Type:</strong> ${record.Type}<br>
    <strong>Capacity kVA:</strong> ${record.Capacity}<br>
    <strong>kV:</strong> ${record.kV}<br>
    <strong>Last Maintenance Date:</strong> ${formatDate(
      record.LastMaintenanceDate
    )}<br>
    <strong>Next Maintenance Date:</strong> ${formatDate(
      record.NextMaintenanceDate
    )}<br>
    <strong>SurgeAr Resistance:</strong> ${
      record.SurgeArResistance || "N/A"
    }<br>
    <strong>Nutrel Resistance:</strong> ${record.NutrelResistance || "N/A"}<br>
    <strong>IR HT-LT:</strong> ${record.IR_HT_LT || "N/A"}<br>
    <strong>IR HT-BODY:</strong> ${record.IR_HT_BODY || "N/A"}<br>
    <strong>IR LT-BODY:</strong> ${record.IR_LT_BODY || "N/A"}<br>
    <strong>Maintenance Cycle:</strong> ${record.Cycle} years<br>
    ${maintenanceStatus}
  `;
  document.getElementById("results").appendChild(resultItem);
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

// Update summary statistics
function updateSummaryStats() {
  const today = new Date();
  const dueMaintenance = electricalData.filter((item) => {
    const nextMaintenanceDate = item.NextMaintenanceDate
      ? new Date(item.NextMaintenanceDate)
      : null;
    return nextMaintenanceDate && today >= nextMaintenanceDate;
  });

  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const nextMonthMaintenance = electricalData.filter((item) => {
    const nextMaintenanceDate = item.NextMaintenanceDate
      ? new Date(item.NextMaintenanceDate)
      : null;
    return (
      nextMaintenanceDate &&
      nextMaintenanceDate > today &&
      nextMaintenanceDate <= nextMonthEnd
    );
  });

  document.getElementById("total-records").textContent = electricalData.length;
  document.getElementById("maintenance-due").textContent =
    dueMaintenance.length;
  document.getElementById("next-month-due").textContent =
    nextMonthMaintenance.length;
}

// Helper function for filtering by type
function filterByType(records, type) {
  if (type === "All") return records;
  return records.filter((record) => record.Type === type);
}

// Helper function for filtering by voltage
function filterByVoltage(records, voltage) {
  if (voltage === "All") return records;
  return records.filter((record) => {
    const kvValue = record.kV.replace(/\s*kV/i, "");
    return kvValue === voltage;
  });
}

// Helper function for filtering by date range (based on LastMaintenanceDate)
function filterByDateRange(records, startDate, endDate) {
  if (!startDate || !endDate) return records;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return records.filter((record) => {
    const lastMaintenanceDate = record.LastMaintenanceDate
      ? new Date(record.LastMaintenanceDate)
      : null;
    return (
      lastMaintenanceDate &&
      lastMaintenanceDate >= start &&
      lastMaintenanceDate <= end
    );
  });
}

// Helper function for filtering by cycle
function filterByCycle(records, cycle) {
  if (cycle === "All") return records;
  return records.filter((record) => String(record.Cycle) === cycle);
}

// Helper function to export data as CSV
function exportToCSV(data, fileNamePrefix) {
  if (data.length === 0) {
    alert("No data to export.");
    return;
  }
  const now = new Date();
  const formattedDateTime = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const fileName = `${fileNamePrefix}_${formattedDateTime}`;
  const escapeCsvValue = (value) =>
    typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
  const headers = [
    ...new Set(data.flatMap((record) => Object.keys(record))),
  ].join(",");
  const rows = data.map((record) =>
    headers
      .split(",")
      .map((key) => escapeCsvValue(record[key] || ""))
      .join(",")
  );
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event Listeners

// Due for Maintenance
document.getElementById("maintenance-btn").addEventListener("click", () => {
  const today = new Date();
  const selectedType = document.getElementById("type-filter").value;
  const selectedVoltage = document.getElementById("voltage-filter").value;

  let filteredResults = electricalData.filter((item) => {
    const nextMaintenanceDate = item.NextMaintenanceDate
      ? new Date(item.NextMaintenanceDate)
      : null;
    return nextMaintenanceDate && today >= nextMaintenanceDate;
  });

  filteredResults = filterByType(filteredResults, selectedType);
  filteredResults = filterByVoltage(filteredResults, selectedVoltage);

  currentFilteredResults = filteredResults;

  document.getElementById("results").innerHTML = "";
  if (currentFilteredResults.length > 0) {
    currentFilteredResults.forEach((record, index) =>
      displayRecord(record, index + 1)
    );
    document.getElementById("no-results").classList.add("hidden");
  } else {
    document.getElementById("no-results").classList.remove("hidden");
  }
});

// Next Month Maintenance
document
  .getElementById("maintenance-next-month-btn")
  .addEventListener("click", () => {
    const today = new Date();
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const selectedType = document.getElementById("type-filter").value;
    const selectedVoltage = document.getElementById("voltage-filter").value;

    let filteredResults = electricalData.filter((item) => {
      const nextMaintenanceDate = item.NextMaintenanceDate
        ? new Date(item.NextMaintenanceDate)
        : null;
      return (
        nextMaintenanceDate &&
        nextMaintenanceDate > today &&
        nextMaintenanceDate <= nextMonthEnd
      );
    });

    filteredResults = filterByType(filteredResults, selectedType);
    filteredResults = filterByVoltage(filteredResults, selectedVoltage);

    currentFilteredResults = filteredResults;

    document.getElementById("results").innerHTML = "";
    if (currentFilteredResults.length > 0) {
      currentFilteredResults.forEach((record, index) =>
        displayRecord(record, index + 1)
      );
      document.getElementById("no-results").classList.add("hidden");
    } else {
      document.getElementById("no-results").classList.remove("hidden");
    }
  });

// Search by SIN
document.getElementById("search-btn").addEventListener("click", () => {
  const searchQuery = document
    .getElementById("sin-search")
    .value.trim()
    .toLowerCase();
  const selectedType = document.getElementById("type-filter").value;
  const selectedVoltage = document.getElementById("voltage-filter").value;

  let filteredResults = electricalData.filter(
    (record) => record.SIN.toLowerCase() === searchQuery
  );
  filteredResults = filterByType(filteredResults, selectedType);
  filteredResults = filterByVoltage(filteredResults, selectedVoltage);

  currentFilteredResults = filteredResults;

  document.getElementById("results").innerHTML = "";
  if (currentFilteredResults.length > 0) {
    currentFilteredResults.forEach(displayRecord);
    document.getElementById("no-results").classList.add("hidden");
  } else {
    document.getElementById("no-results").classList.remove("hidden");
  }
  document.getElementById("sin-search").value = "I";
});

// Filter by Date Range, Type, Voltage, and Cycle
document
  .getElementById("date-range-filter-btn")
  .addEventListener("click", () => {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const selectedType = document.getElementById("type-filter-range").value;
    const selectedVoltage = document.getElementById(
      "voltage-filter-range"
    ).value;
    const selectedCycle = document.getElementById("cycle-filter-range").value;

    // Validate date inputs
    if (!startDate || !endDate) {
      alert("Please select both a start date and an end date.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date.");
      return;
    }

    // Filter by date range, type, voltage, and cycle
    let filteredResults = filterByDateRange(electricalData, startDate, endDate);
    filteredResults = filterByType(filteredResults, selectedType);
    filteredResults = filterByVoltage(filteredResults, selectedVoltage);
    filteredResults = filterByCycle(filteredResults, selectedCycle);

    currentFilteredResults = filteredResults;

    // Display results
    document.getElementById("results").innerHTML = "";
    if (currentFilteredResults.length > 0) {
      currentFilteredResults.forEach((record, index) =>
        displayRecord(record, index + 1)
      );
      document.getElementById("no-results").classList.add("hidden");
    } else {
      document.getElementById("no-results").classList.remove("hidden");
    }
  });

// Export filtered results as CSV
document.getElementById("export-btn").addEventListener("click", () => {
  exportToCSV(currentFilteredResults, "Galle_filtered_data");
});

// Export all data as CSV
document.getElementById("export-all-btn").addEventListener("click", () => {
  exportToCSV(electricalData, "Galle_all_data");
});

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});
