const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const port = 3099;

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load the JSON data
const dataPath = path.join(__dirname, "data", "updated_data.json");
let electricalData = [];
(async () => {
  try {
    electricalData = JSON.parse(await fs.readFile(dataPath, "utf-8"));
  } catch (error) {
    console.error("Error reading updated_data.json:", error);
    process.exit(1);
  }
})();

// Helper function to calculate next maintenance date
function calculateNextMaintenanceDate(lastMaintenanceDate, cycle) {
  if (!lastMaintenanceDate) return null;
  const lastDate = new Date(lastMaintenanceDate);
  const nextDate = new Date(
    lastDate.getTime() + cycle * 365 * 24 * 60 * 60 * 1000
  );
  return nextDate.toISOString().split("T")[0];
}

// Home route
app.get("/", (req, res) => {
  res.render("index", { electricalData });
});

// Record Management route
app.get("/record-management", (req, res) => {
  res.render("record-management", { electricalData });
});

// Reporting route
app.get("/reporting", (req, res) => {
  res.render("reporting", { electricalData });
});

// API to get all records
app.get("/api/records", (req, res) => {
  res.json(electricalData);
});

// API to add a new record
app.post("/api/records", async (req, res) => {
  const newRecord = req.body;

  // Ensure SIN is unique
  if (electricalData.some((record) => record.SIN === newRecord.SIN)) {
    return res.status(400).json({ error: "SIN already exists" });
  }

  newRecord.NextMaintenanceDate = calculateNextMaintenanceDate(
    newRecord.LastMaintenanceDate,
    newRecord.Cycle
  );

  // Ensure new fields are included (default to null if missing)
  newRecord.IR_HT_LT = newRecord.IR_HT_LT || null;
  newRecord.IR_HT_BODY = newRecord.IR_HT_BODY || null;
  newRecord.IR_LT_BODY = newRecord.IR_LT_BODY || null;
  newRecord.new_sub =
    newRecord.new_sub === "true" || newRecord.new_sub === true;

  try {
    electricalData.push(newRecord);
    await fs.writeFile(dataPath, JSON.stringify(electricalData, null, 2));
    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error saving record:", error);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// API to update a record
app.put("/api/records/:sin", async (req, res) => {
  const sin = req.params.sin;
  const updatedRecord = req.body;

  updatedRecord.NextMaintenanceDate = calculateNextMaintenanceDate(
    updatedRecord.LastMaintenanceDate,
    updatedRecord.Cycle
  );

  // Ensure new fields are included
  updatedRecord.IR_HT_LT = updatedRecord.IR_HT_LT || null;
  updatedRecord.IR_HT_BODY = updatedRecord.IR_HT_BODY || null;
  updatedRecord.IR_LT_BODY = updatedRecord.IR_LT_BODY || null;
  updatedRecord.new_sub =
    updatedRecord.new_sub === "true" || updatedRecord.new_sub === true;

  const index = electricalData.findIndex((record) => record.SIN === sin);
  if (index !== -1) {
    electricalData[index] = updatedRecord;
    try {
      await fs.writeFile(dataPath, JSON.stringify(electricalData, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error("Error updating record:", error);
      res.status(500).json({ error: "Failed to update record" });
    }
  } else {
    res.status(404).json({ error: "Record not found" });
  }
});

// API to delete a record
app.delete("/api/records/:sin", async (req, res) => {
  const sin = req.params.sin;
  const index = electricalData.findIndex((record) => record.SIN === sin);
  if (index !== -1) {
    electricalData.splice(index, 1);
    try {
      await fs.writeFile(dataPath, JSON.stringify(electricalData, null, 2));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({ error: "Failed to delete record" });
    }
  } else {
    res.status(404).json({ error: "Record not found" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
