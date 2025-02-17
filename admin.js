// admin.js
// Timetable data
const timetable = {
  Day1: {
    Pry1: ["English", "Mathematics"],
    Pry2: ["Basic Science", "CCA"],
    Pry3: ["National Value", "Prevocational Studies"],
    Pry4: ["English", "Mathematics"],
    Pry5: ["CRK", "French"],
    Pry6: ["English", "Mathemmatics", "General Studies"],
  },
  Day2: {
    Pry1: ["CCA", "Basic Science"],
    Pry2: ["English", "Mathematics"],
    Pry3: ["CRK", "English"],
    Pry4: ["CCA", "Prevocational Studies"],
    Pry5: ["English", "Mathematics"],
    Pry6: ["CRK", "French"],
  },
  Day3: {
    Pry1: ["National Value", "CRK"],
    Pry2: ["Prevocational Studies", "National Value"],
    Pry3: ["Mathematics", "CCA"],
    Pry4: ["Basic Science", "National Value"],
    Pry5: ["Prevocational Studies", "CCA"],
    Pry6: ["English", "Mathematics"],
  },
  Day4: {
    Pry1: ["Prevocational Studies", "English"],
    Pry2: ["CRK", "Basic Science"],
    Pry3: ["Basic Science", "National Value"],
    Pry4: ["CRK", "French"],
    Pry5: ["Basic Science", "National Value"],
    Pry6: ["CCA", "Prevocational Studies"],
  },
  Day5: {
    Pry1: ["Mathematics", "Basic Science"],
    Pry2: ["CCA", "English"],
    Pry3: ["Prevocational Studies", "CRK"],
    Pry4: ["National Value", "English"],
    Pry5: ["CRK", "Prevocational Studies"],
    Pry6: ["French", "Basic Science"],
  },
  Day6: {
    Pry1: ["CRK", "Prevocational Studies"],
    Pry2: ["Mathematics", "National Value"],
    Pry3: ["English", "Mathematics"],
    Pry4: ["Basic Science", "CCA"],
    Pry5: ["National Value", "English"],
    Pry6: ["Mathematics", "CCA"],
  },
};

// Function to update subject options
function updateSubjects() {
  const selectedDay = document.getElementById("day").value;
  const selectedClass = document.getElementById("class").value;
  const subjectOptionsDiv = document.getElementById("subject-options");

  subjectOptionsDiv.innerHTML = "<label>Select Subject:</label>";

  if (selectedDay && selectedClass && timetable[selectedDay]?.[selectedClass]) {
    const subjects = timetable[selectedDay][selectedClass];
    subjects.forEach((subject, index) => {
      const radioDiv = document.createElement("div");
      radioDiv.className = "subject-radio";
      radioDiv.innerHTML = `
              <input type="radio" id="subject${index}" name="subject" value="${subject}">
              <label for="subject${index}">${subject}</label>
          `;
      subjectOptionsDiv.appendChild(radioDiv);
    });
  }
}

// Function to parse vertical spreadsheet format (each row is a complete question)
function parseHorizontalSpreadsheet(data) {
  // Remove empty rows
  const filteredData = data.filter((row) => row.some((cell) => cell !== ""));

  if (filteredData.length === 0) {
    throw new Error("Spreadsheet is empty");
  }

  // Check if first row contains headers
  const firstRow = filteredData[0].map((cell) =>
    cell?.toString().toLowerCase().trim()
  );
  const hasHeaders = firstRow.some(
    (cell) =>
      cell.includes("question") ||
      cell.includes("option") ||
      cell.includes("answer")
  );

  // Start processing from row 1 if headers exist, otherwise from row 0
  const startIndex = hasHeaders ? 1 : 0;

  const questions = [];

  // Process each row (each row is a complete question)
  for (let i = startIndex; i < filteredData.length; i++) {
    const row = filteredData[i];

    // Expect 6 columns: Question, Option A, B, C, D, and Answer
    if (row.length < 6) {
      throw new Error(
        `Row ${
          i + 1
        } does not have all required columns. Expected: Question, Options A-D, Answer`
      );
    }

    const [question, optionA, optionB, optionC, optionD, answer] = row.map(
      (cell) => cell?.toString().trim() ?? ""
    );

    // Skip rows where question is empty
    if (!question) continue;

    questions.push({
      question,
      options: [
        `A) ${cleanOptionText(optionA, "A")}`,
        `B) ${cleanOptionText(optionB, "B")}`,
        `C) ${cleanOptionText(optionC, "C")}`,
        `D) ${cleanOptionText(optionD, "D")}`,
      ],
      answer: answer.toUpperCase(),
    });
  }

  return questions;
}

// Helper function to clean option text
function cleanOptionText(text, optionLetter) {
  if (!text) return "";

  const cleaned = text.toString().trim();
  // Remove option prefix if it exists (e.g., "A)", "A.", "A-", etc.)
  const regex = new RegExp(`^${optionLetter}[).:\\-\\s]*`, "i");
  return cleaned.replace(regex, "").trim();
}

// Updated validation function
function validateQuestions(questions) {
  const issues = [];

  if (questions.length === 0) {
    issues.push("No valid questions found in the spreadsheet");
    return issues;
  }

  questions.forEach((q, index) => {
    const questionNumber = index + 1;

    // Check question text
    if (!q.question) {
      issues.push(`Row ${questionNumber}: Missing question text`);
    }

    // Validate options
    q.options.forEach((opt, optIndex) => {
      const optionLetter = ["A", "B", "C", "D"][optIndex];
      const optionText = opt.split(") ")[1];

      if (!optionText || optionText.trim() === "") {
        issues.push(`Row ${questionNumber}: Option ${optionLetter} is empty`);
      }
    });

    // Validate answer
    if (!q.answer) {
      issues.push(`Row ${questionNumber}: Missing answer`);
    } else if (!["A", "B", "C", "D"].includes(q.answer)) {
      issues.push(
        `Row ${questionNumber}: Invalid answer '${q.answer}' (must be A, B, C, or D)`
      );
    }

    // Check for duplicate options
    const optionTexts = q.options.map((opt) =>
      opt.split(") ")[1].toLowerCase().trim()
    );
    const uniqueOptions = new Set(optionTexts);
    if (uniqueOptions.size !== optionTexts.length) {
      issues.push(`Row ${questionNumber}: Contains duplicate options`);
    }
  });

  return issues;
}

// Function to process spreadsheet
async function processSpreadsheet() {
  const selectedDay = document.getElementById("day").value;
  const selectedClass = document.getElementById("class").value;
  const selectedSubject = document.querySelector(
    'input[name="subject"]:checked'
  )?.value;
  const fileInput = document.getElementById("doc");
  const outputDiv = document.getElementById("output");

  //// Validation
  if (
    !selectedDay ||
    !selectedClass ||
    !selectedSubject ||
    !fileInput.files[0]
  ) {
    alert("Please select all required fields and upload a spreadsheet.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert to array of arrays to preserve row structure
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "", // Default value for empty cells
      });

      // Skip empty rows
      const filteredData = rawData.filter((row) =>
        row.some((cell) => cell !== "")
      );

      if (filteredData.length < 1) {
        throw new Error("Spreadsheet is empty");
      }

      // Parse questions from vertical format
      const questions = parseHorizontalSpreadsheet(filteredData);

      // Validate questions
      const validationIssues = validateQuestions(questions);
      if (validationIssues.length > 0) {
        outputDiv.innerHTML = `
                <h3>Validation Issues:</h3>
                <ul>
                    ${validationIssues
                      .map((issue) => `<li>${issue}</li>`)
                      .join("")}
                </ul>
            `;
        return;
      }

      // Save to localStorage
      const questionsDB = JSON.parse(localStorage.getItem("questionsDB")) || {};
      if (!questionsDB[selectedDay]) questionsDB[selectedDay] = {};
      if (!questionsDB[selectedDay][selectedClass])
        questionsDB[selectedDay][selectedClass] = {};

      questionsDB[selectedDay][selectedClass][selectedSubject] = questions;
      localStorage.setItem("questionsDB", JSON.stringify(questionsDB));

      // Display parsed questions
      displayParsedQuestions(questions, outputDiv);
      displayUploadedDocs();

      alert("Questions added successfully!");
    } catch (error) {
      console.error("Error processing spreadsheet:", error);
      outputDiv.innerHTML = `
            <p class="error">Error processing spreadsheet: ${error.message}</p>
            <p>Please check the file format and try again.</p>
        `;
    }
  };

  reader.readAsArrayBuffer(file);
}

// Function to download template
function downloadTemplate() {
  const wsData = [
    ["Question", "Option A", "Option B", "Option C", "Option D", "Answer"],
    ["What is 2 + 2?", "3", "4", "5", "6", "B"],
    ["", "", "", "", "", ""], // Empty row for user to fill
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "question_template.xlsx");
}

// Function to display parsed questions
function displayParsedQuestions(questions, outputDiv) {
  outputDiv.innerHTML = "<h3>Parsed Questions:</h3>";

  questions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
        <p><strong>Question ${index + 1}:</strong> ${q.question}</p>
        <p><strong>Options:</strong></p>
        <ul>
            ${q.options.map((opt) => `<li>${opt}</li>`).join("")}
        </ul>
        <p><strong>Answer:</strong> ${q.answer}</p>
    `;
    outputDiv.appendChild(questionDiv);
  });
}

// Function to display uploaded documents
function displayUploadedDocs() {
  const questionsDB = JSON.parse(localStorage.getItem("questionsDB")) || {};
  const uploadedDocsDiv = document.getElementById("uploaded-docs");
  uploadedDocsDiv.innerHTML = "";

  for (const day in questionsDB) {
    for (const className in questionsDB[day]) {
      for (const subject in questionsDB[day][className]) {
        const docItem = document.createElement("div");
        docItem.className = "doc-item";
        docItem.innerHTML = `
                <div class="doc-info">
                    <strong>Day:</strong> ${day} | 
                    <strong>Class:</strong> ${className} | 
                    <strong>Subject:</strong> ${subject}
                    <br>
                    <small>Questions: ${questionsDB[day][className][subject].length}</small>
                </div>
                <div class="doc-actions">
                    <button class="btn-delete" onclick="deleteDocument('${day}', '${className}', '${subject}')">
                        Delete
                    </button>
                    <button class="btn-view" onclick="viewDocument('${day}', '${className}', '${subject}')">
                        View
                    </button>
                    <button class="btn-template" onclick="downloadAsExcel('${day}', '${className}', '${subject}')">
                        Download
                    </button>
                </div>
            `;
        uploadedDocsDiv.appendChild(docItem);
      }
    }
  }

  if (uploadedDocsDiv.innerHTML === "") {
    uploadedDocsDiv.innerHTML = "<p>No documents uploaded yet.</p>";
  }
}

// Function to download questions as Excel
function downloadAsExcel(day, className, subject) {
  const questionsDB = JSON.parse(localStorage.getItem("questionsDB")) || {};
  const questions = questionsDB[day][className][subject];

  // Convert questions to worksheet format
  const wsData = [
    ["Question", "Option A", "Option B", "Option C", "Option D", "Answer"],
  ];

  questions.forEach((q) => {
    wsData.push([
      q.question,
      q.options[0].split(") ")[1],
      q.options[1].split(") ")[1],
      q.options[2].split(") ")[1],
      q.options[3].split(") ")[1],
      q.answer,
    ]);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  // Generate filename
  const filename = `${day}_${className}_${subject}_Questions.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
}

// Function to delete a document
function deleteDocument(day, className, subject) {
  if (
    confirm(
      `Are you sure you want to delete the ${subject} exam for ${className} on ${day}?`
    )
  ) {
    const questionsDB = JSON.parse(localStorage.getItem("questionsDB")) || {};

    delete questionsDB[day][className][subject];

    if (Object.keys(questionsDB[day][className]).length === 0) {
      delete questionsDB[day][className];
    }
    if (Object.keys(questionsDB[day]).length === 0) {
      delete questionsDB[day];
    }

    localStorage.setItem("questionsDB", JSON.stringify(questionsDB));
    displayUploadedDocs();

    // Clear output div when document is deleted
    document.getElementById("output").innerHTML = "";
    alert("Document deleted successfully!");
  }
}

// Function to view a document
function viewDocument(day, className, subject) {
  const questionsDB = JSON.parse(localStorage.getItem("questionsDB")) || {};
  const questions = questionsDB[day][className][subject];
  const outputDiv = document.getElementById("output");
  displayParsedQuestions(questions, outputDiv);
}

// Initialize on page load
window.onload = function () {
  displayUploadedDocs();
  document.getElementById("day").addEventListener("change", updateSubjects);
  document.getElementById("class").addEventListener("change", updateSubjects);
};
