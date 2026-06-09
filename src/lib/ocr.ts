interface PassportOcrResult {
  provider: "google" | "ocrspace";
  mrzLine1: string;
  mrzLine2: string;
  surname: string;
  givenNames: string[];
  firstNameAmh: string;
  middleNameAmh: string;
  lastNameAmh: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  gender: "M" | "F";
  placeOfBirth: string;
  issuingCountry: string;
  confidenceScore: number;
  rawText: string;
  multilingualText: {
    english: string;
    amharic: string;
    arabic: string;
  };
  warnings: string[];
}

type ParsedPassportFields = Omit<PassportOcrResult, "provider" | "rawText" | "multilingualText" | "warnings"> & {
  placeOfIssue?: string;
};

function parseYY(yy: string): number {
  const year = parseInt(yy, 10);
  return year >= 50 ? 1900 + year : 2000 + year;
}

function formatMrzDate(yyMMdd: string): string {
  if (!/^\d{6}$/.test(yyMMdd)) return "";
  return `${parseYY(yyMMdd.slice(0, 2))}-${yyMMdd.slice(2, 4)}-${yyMMdd.slice(4, 6)}`;
}

function extractMultilingualText(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    english: lines.filter((line) => /[A-Za-z]/.test(line)).join("\n"),
    amharic: lines.filter((line) => /[\u1200-\u137F]/.test(line)).join("\n"),
    arabic: lines.filter((line) => /[\u0600-\u06FF]/.test(line)).join("\n"),
  };
}

// Amharic label words that appear on Ethiopian passports and should be filtered from name values
const AMHARIC_LABEL_WORDS = new Set<string>([
  "ስም", "የስም", "ስሙ", "ስሜ", "ስማ", "ስማቸው", // name / of-name / his-name / their-name
  "አባት", "የአባት", "አባ", // father / of-father
  "አያት", "የአያት", // grandfather / of-grandfather
  "የመጀመሪያ", "መጀመሪያ", // first
  "የተወለደበት", "ተወለደ", // place of birth
  "ጾታ", // sex
  "ዜግነት", "ዜጋ", // nationality
  "የትውልድ", "ትውልድ", // origin
  "ቀን", // date
  "የጉዞ", // travel
  "ሰነድ", // document
  "የፓስፖርት", "ፓስፖርት", // passport
  "ወር", "ዓመት", // month, year
  "የምስል", "ምስል", // photo/picture
  "የባለቤት", "ባለቤት", // spouse
  "የተፈረመ", "ፊርማ", // signature
  "ሙያ", "ሥራ", // occupation
  "ቁጥር", // number
  "ሀገር", "አገር", // country
]);

// Ethiopic genitive prefix "የ" marks possessive label words (የስም, የአባት, የጉዞ ...).
// Real name values almost never begin with it, so it is a strong label signal.
const AMHARIC_GENITIVE_PREFIX = "የ";

/**
 * Normalise a line by stripping Ethiopic punctuation (word-space ፡, full-stop ።,
 * comma ፣, semicolon ፤, colon ፦, etc.) and ASCII separators that OCR leaves behind.
 */
function cleanAmharicLine(line: string): string {
  return line
    .replace(/[\u1360-\u1368\u00B7:|/\\,.;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decide whether an Amharic token is a label rather than a name value.
 * Combines an exact dictionary match, the genitive-prefix heuristic, and a
 * conservative substring check (only for longer labels) to catch tokens that
 * OCR has glued together.
 */
function isAmharicLabelWord(word: string): boolean {
  if (AMHARIC_LABEL_WORDS.has(word)) return true;
  // Short tokens starting with the genitive prefix are almost always labels.
  if (word.startsWith(AMHARIC_GENITIVE_PREFIX) && word.length <= 6) return true;
  // A long label may be concatenated with surrounding text by OCR.
  for (const label of AMHARIC_LABEL_WORDS) {
    if (label.length >= 4 && word.includes(label)) return true;
  }
  return false;
}

/**
 * Extract clean Amharic name tokens from a single line: strips punctuation,
 * keeps only Ethiopic runs longer than one character, and drops label words.
 */
function extractAmharicWords(line: string): string[] {
  const cleaned = cleanAmharicLine(line);
  const words = cleaned.match(/[\u1200-\u137F]+/g) || [];
  return words.filter((w) => w.length > 1 && !isAmharicLabelWord(w));
}

function findAmharicValueOnLineOrNear(lines: string[], startIdx: number, skipLines: number = 3): string {
  // Look through the next few lines for Amharic name words.
  // We NO LONGER require pure-Amharic lines — on Ethiopian passports
  // the Amharic name often lives on the *same* line as the English label.
  for (let i = startIdx; i < Math.min(startIdx + 1 + skipLines, lines.length); i++) {
    const line = lines[i];
    const hasAmharic = /[\u1200-\u137F]/.test(line);
    if (!hasAmharic) continue;

    const filtered = extractAmharicWords(line);
    if (filtered.length > 0) {
      return filtered.join(" ");
    }
  }
  return "";
}

function extractAmharicNameFields(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let surnameAmh = "";
  let fatherNameAmh = "";
  let firstNameAmh = "";

  // -----------------------------------------------------------------
  // Label-guided extraction: look at each line, identify whether it is
  // a SURNAME or a GIVEN-NAME field, and pull the Amharic tokens from
  // exactly that line (or the next pure-Amharic line if the value dropped
  // to the next line).
  //
  // Ethiopian passport layout:
  //   SURNAME / LAST NAME  → grandfather's name (lastNameAmh)
  //   GIVEN NAMES / NAME   → first name + father's name
  // -----------------------------------------------------------------
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();
    const hasAmharic = /[\u1200-\u137F]/.test(line);

    // ---- SURNAME / LAST NAME / የአያት ስም ----
    const isSurnameLine =
      upper.includes("SURNAME") ||
      upper.includes("FAMILY NAME") ||
      upper.includes("LAST NAME") ||
      (hasAmharic && (line.includes("አያት") || line.includes("የአያት")));

    if (isSurnameLine) {
      const words = extractAmharicWords(line);
      if (words.length > 0) {
        surnameAmh = words.join(" ");
      } else {
        const next = findAmharicValueOnLineOrNear(lines, i, 3);
        if (next) surnameAmh = next;
      }
      continue;
    }

    // ---- GIVEN NAMES / NAME / ስም ----
    const isGivenLine =
      upper.includes("GIVEN") ||
      upper.includes("FIRST NAME") ||
      (upper.includes("NAME") &&
        !upper.includes("SURNAME") &&
        !/\bFAMILY\s+NAME|\bLAST\s+NAME/.test(upper)) ||
      (hasAmharic && /[ሀ-፿]/.test(line) && !line.includes("አያት"));

    if (isGivenLine) {
      const words = extractAmharicWords(line);
      if (words.length >= 2) {
        firstNameAmh = words[0];
        fatherNameAmh = words.slice(1).join(" ");
      } else if (words.length === 1) {
        // Only one word on this line – might be first name; father's name may be below
        firstNameAmh = words[0];
        const next = findAmharicValueOnLineOrNear(lines, i, 3);
        if (next && !fatherNameAmh) fatherNameAmh = next;
      } else {
        // No words on label line, try next lines
        const next = findAmharicValueOnLineOrNear(lines, i, 3);
        if (next) {
          const parts = next.split(/\s+/).filter(Boolean);
          if (parts.length >= 1) firstNameAmh = parts[0];
          if (parts.length >= 2) fatherNameAmh = parts.slice(1).join(" ");
        }
      }
      // We do NOT `continue` here — some passports put both given names
      // on the same physical line, and we want to avoid accidentally
      // also matching a following surname line with a loose "NAME" check.
      continue;
    }
  }

  // -----------------------------------------------------------------
  // Fallback 1: If still missing names, scan ALL lines for any line
  // with at least 3 clean Amharic words and assign by order.
  // -----------------------------------------------------------------
  if (!firstNameAmh || !surnameAmh) {
    const allWords: string[] = [];
    for (const line of lines) {
      const words = extractAmharicWords(line);
      for (const w of words) {
        if (!allWords.includes(w)) allWords.push(w);
      }
    }
    if (allWords.length >= 3) {
      // Typical Ethiopian passport order appears as:
      // SURNAME line first (grandfather), then GIVEN NAMES (first + father)
      // But the fallback order below reads the text top-to-bottom.
      // If the text is mixed, safest is: first=first, middle=second, last=last
      if (!firstNameAmh) firstNameAmh = allWords[0];
      if (!fatherNameAmh && allWords.length >= 2) fatherNameAmh = allWords.slice(1, -1).join(" ") || allWords[1];
      if (!surnameAmh) surnameAmh = allWords[allWords.length - 1];
    } else if (allWords.length === 2) {
      if (!firstNameAmh) firstNameAmh = allWords[0];
      if (!fatherNameAmh) fatherNameAmh = allWords[1];
    } else if (allWords.length === 1) {
      if (!firstNameAmh) firstNameAmh = allWords[0];
    }
  }

  // -----------------------------------------------------------------
  // Fallback 2: If we have a surname but no first name (or vice versa),
  // and they are the same string, clear the duplicate to avoid
  // presenting the same word twice.
  // -----------------------------------------------------------------
  if (firstNameAmh === surnameAmh && firstNameAmh) {
    surnameAmh = "";
  }

  return {
    firstNameAmh,
    middleNameAmh: fatherNameAmh,
    lastNameAmh: surnameAmh,
  };
}


/**
 * Numeric date matchers.
 * DATE_DMY  →  DD / MM / YYYY (or . - space separators)
 * DATE_YMD  →  YYYY / MM / DD
 */
const DATE_DMY = /\b(\d{2})[\/\.\-\s](\d{2})[\/\.\-\s](\d{2,4})\b/;
const DATE_YMD = /\b(\d{4})[\/\.\-\s](\d{2})[\/\.\-\s](\d{2})\b/;

/**
 * Textual date matcher for passports that print month names.
 * Supports  "12 AUG 2012", "12-Aug-2012", "12 Aug 2012", "27 FEB 26", etc.
 */
const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DATE_TEXTUAL = /\b(\d{1,2})[\s\/\-\.]([A-Z]{3,9})[\s\/\-\.](\d{2,4})\b/;

function monthNameToNumber(monthStr: string): string | null {
  const idx = MONTH_NAMES.indexOf(monthStr.toUpperCase().slice(0, 3));
  return idx >= 0 ? String(idx + 1).padStart(2, "0") : null;
}

function isValidYear(yearStr: string): boolean {
  const y = yearStr.length === 2 ? parseYY(yearStr) : parseInt(yearStr, 10);
  return y >= 1900 && y <= 2099;
}

function parseDateFromMatch(m: RegExpMatchArray): string | null {
  // Try numeric formats first
  const numeric = m[0].match(DATE_DMY);
  if (numeric) {
    // DD/MM/YYYY → YYYY-MM-DD
    let year = numeric[3];
    if (year.length === 2) year = parseYY(year).toString();
    return `${year}-${numeric[2]}-${numeric[1]}`;
  }
  const ymd = m[0].match(DATE_YMD);
  if (ymd) {
    // YYYY/MM/DD
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }
  // Try textual month format (e.g. "12 AUG 2012")
  const textual = m[0].match(DATE_TEXTUAL);
  if (textual) {
    const month = monthNameToNumber(textual[2]);
    let year = textual[3];
    if (year.length === 2) year = parseYY(year).toString();
    if (month) return `${year}-${month}-${textual[1].padStart(2, "0")}`;
  }
  return null;
}

/**
 * Extract additional fields from the raw OCR text that aren't in the MRZ:
 * - dateOfIssue (often labeled as "Date of Issue" or "Issuance Date")
 * - placeOfBirth (often labeled as "Place of Birth" or "Place of Origin")
 */
function extractAdditionalFields(rawText: string) {
  const upper = rawText.toUpperCase();
  let dateOfIssue = "";

  // --- Strategy 1: English and Amharic label + date on same line ---
  // Ethiopian passports may have the issue-date label in Amharic:
  // "የተሰጠበት ቀን"  (day of issue) or "Date of Issue"
  const issuePositions: number[] = [];
  const issueLabels = /DATE\s+OF\s+ISSUE|ISSUE\s+DATE|ISSUANCE\s+DATE|DATE\s+OF\s+ISSUANCE|DATE\s+ISSUED|\bISSUE\b|\bISSUANCE\b|\bISSUED\b|የተሰጠበት/g;
  let m;
  while ((m = issueLabels.exec(upper)) !== null) {
    issuePositions.push(m.index);
  }

  // Check text around each label for a date (generous 150-char window)
  for (const pos of issuePositions) {
    const windowStart = Math.max(0, pos - 15);
    const windowEnd = Math.min(upper.length, pos + 150);
    const windowText = upper.slice(windowStart, windowEnd);

    const dmy = windowText.match(DATE_DMY);
    if (dmy && isValidYear(dmy[3])) {
      const parsed = parseDateFromMatch(dmy);
      if (parsed) { dateOfIssue = parsed; break; }
    }
    const ymd = windowText.match(DATE_YMD);
    if (ymd && isValidYear(ymd[1])) {
      const parsed = parseDateFromMatch(ymd);
      if (parsed) { dateOfIssue = parsed; break; }
    }
    const txt = windowText.match(DATE_TEXTUAL);
    if (txt) {
      const parsed = parseDateFromMatch(txt);
      if (parsed) { dateOfIssue = parsed; break; }
    }
  }

  // --- Strategy 2: Multi-line — check next 5 lines after any issue label ---
  if (!dateOfIssue) {
    const rawLines = rawText.split(/\r?\n/);
    for (let i = 0; i < rawLines.length; i++) {
      const lineUpper = rawLines[i].toUpperCase();
      if (/ISSUE|ISSUANCE|ISSUED|የተሰጠበት/i.test(lineUpper)) {
        for (let j = i; j < Math.min(i + 6, rawLines.length); j++) {
          const checkLine = rawLines[j].toUpperCase();
          let d = checkLine.match(DATE_DMY);
          if (d && isValidYear(d[3])) { const p = parseDateFromMatch(d); if (p) { dateOfIssue = p; break; } }
          d = checkLine.match(DATE_YMD);
          if (d && isValidYear(d[1])) { const p = parseDateFromMatch(d); if (p) { dateOfIssue = p; break; } }
          d = checkLine.match(DATE_TEXTUAL);
          if (d) { const p = parseDateFromMatch(d); if (p) { dateOfIssue = p; break; } }
        }
        if (dateOfIssue) break;
      }
    }
  }

  // --- Strategy 3: Any date on the page that is NOT expiry-related ---
  if (!dateOfIssue) {
    const allDates = [...upper.matchAll(new RegExp(DATE_DMY.source, "g"))];
    for (const d of allDates) {
      const parsed = parseDateFromMatch(d);
      if (!parsed) continue;
      const before = upper.slice(Math.max(0, (d.index || 0) - 80), (d.index || 0));
      if (/ISSUE|ISSUANCE|ISSUED|PASSPORT|DOCUMENT/.test(before)) {
        dateOfIssue = parsed;
        break;
      }
    }
  }

  // Place of Birth
  let placeOfBirth = "";
  const pobMatch =
    upper.match(/PLACE\s*OF\s*BIRTH[\s:]+([A-Z\s]+?)(?:\n|\r|$)/) ||
    upper.match(/BIRTH\s*PLACE[\s:]+([A-Z\s]+?)(?:\n|\r|$)/) ||
    upper.match(/PLACE\s*OF\s*ORIGIN[\s:]+([A-Z\s]+?)(?:\n|\r|$)/);

  if (pobMatch) {
    placeOfBirth = pobMatch[1].trim().replace(/\s+/g, " ");
    const cleanWords = ["SEX", "GENDER", "DATE", "DOB", "NATIONALITY", "HEIGHT", "WEIGHT", "OCCUPATION"];
    for (const word of cleanWords) {
      const idx = placeOfBirth.indexOf(word);
      if (idx > 0) {
        placeOfBirth = placeOfBirth.substring(0, idx).trim();
        break;
      }
    }
  }

  return {
    dateOfIssue,
    placeOfBirth,
    placeOfIssue: "Addis Ababa",
  };
}
function extractMrz(rawText: string): { line1: string; line2: string } | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s/g, ""))
    .filter(Boolean);

  const candidates = lines.filter((line) => line.length >= 44 && /^[A-Z0-9<]+$/.test(line));
  if (candidates.length >= 2) {
    return { line1: candidates[candidates.length - 2], line2: candidates[candidates.length - 1] };
  }

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (lines[index].startsWith("P<") && lines[index + 1].length >= 44) {
      return { line1: lines[index], line2: lines[index + 1] };
    }
  }

  return null;
}

function getMrzCharacterValue(char: string) {
  if (char === "<") return 0;
  if (/^\d$/.test(char)) return parseInt(char, 10);
  return char.charCodeAt(0) - 55;
}

function computeMrzCheckDigit(value: string) {
  const weights = [7, 3, 1];
  return (
    value
      .split("")
      .reduce((sum, char, index) => sum + getMrzCharacterValue(char) * weights[index % 3], 0) % 10
  ).toString();
}

function isMrzValidated(line1: string, line2: string) {
  if (line1.length < 44 || line2.length < 44) {
    return false;
  }

  const checks = [
    [line2.substring(0, 9), line2.substring(9, 10)],
    [line2.substring(13, 19), line2.substring(19, 20)],
    [line2.substring(21, 27), line2.substring(27, 28)],
    [line2.substring(28, 42), line2.substring(42, 43)],
    [line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43), line2.substring(43, 44)],
  ] as const;

  return checks.every(([value, expected]) => expected && computeMrzCheckDigit(value) === expected);
}

function parseMrz(line1: string, line2: string, rawText: string): ParsedPassportFields {
  const nationalityCode = line1.substring(2, 5);
  const nameSection = line1.substring(5).replace(/<+$/, "");
  const nameParts = nameSection.split("<<").map((part) => part.trim().replace(/</g, " "));
  const surname = nameParts[0] || "";
  const givenNames = (nameParts[1] || "").split(" ").filter((part) => part.length > 0);
  const gender = line2.substring(20, 21);

  // Extract additional fields not in MRZ
  const additional = extractAdditionalFields(rawText);

  return {
    mrzLine1: line1,
    mrzLine2: line2,
    surname,
    givenNames,
    firstNameAmh: "",
    middleNameAmh: "",
    lastNameAmh: "",
    passportNumber: line2.substring(0, 9).replace(/</g, "").trim(),
    nationality: nationalityCode === "ETH" ? "Ethiopian" : nationalityCode,
    dateOfBirth: formatMrzDate(line2.substring(13, 19)),
    dateOfIssue: additional.dateOfIssue,
    dateOfExpiry: formatMrzDate(line2.substring(21, 27)),
    gender: gender === "M" ? "M" : "F",
    placeOfBirth: additional.placeOfBirth,
    placeOfIssue: additional.placeOfIssue,
    issuingCountry: nationalityCode === "ETH" ? "Ethiopia" : nationalityCode,
    confidenceScore: 0.92,
  };
}

function regexParse(rawText: string): ParsedPassportFields {
  const upper = rawText.toUpperCase();
  const passportNumber = upper.match(/([A-Z]{2}[0-9]{6,9})/)?.[1] || "";
  const dobMatch = upper.match(/(19|20)(\d{2})[/.-](0[1-9]|1[0-2])[/.-](0[1-9]|[12]\d|3[01])/);
  const expMatch =
    upper.match(/EXPIRY[\s:]+([0-9]{2})[/.-]([0-9]{2})[/.-]([0-9]{4})/) ||
    upper.match(/EXPIRES?[\s:]+([0-9]{2})[/.-]([0-9]{2})[/.-]([0-9]{4})/);
  const surname =
    rawText.match(/SURNAME[\/\s:]+([A-Z]+)/i)?.[1] ||
    rawText.match(/FAMILY NAME[\/\s:]+([A-Z]+)/i)?.[1] ||
    rawText.match(/LAST NAME[\/\s:]+([A-Z]+)/i)?.[1] ||
    "";
  const givenRaw =
    rawText.match(/GIVEN NAMES?[\/\s:]+([A-Z\s]+)/i)?.[1] ||
    rawText.match(/FIRST NAMES?[\/\s:]+([A-Z\s]+)/i)?.[1] ||
    "";
  const gender: "M" | "F" =
    upper.includes("SEX/M") || upper.includes("GENDER/M") || upper.includes(" M ") ? "M" : "F";
  const confidenceScore =
    (passportNumber ? 0.45 : 0) + (dobMatch ? 0.2 : 0) + (expMatch ? 0.2 : 0) + (surname ? 0.15 : 0);

  return {
    mrzLine1: "",
    mrzLine2: "",
    surname,
    givenNames: givenRaw.split(/\s+/).filter((part) => part.length > 1),
    firstNameAmh: "",
    middleNameAmh: "",
    lastNameAmh: "",
    passportNumber,
    nationality: upper.includes("ETHIOPIA") || upper.includes("ETHIOPIAN") ? "Ethiopian" : "",
    dateOfBirth: dobMatch ? `${dobMatch[1]}${dobMatch[2]}-${dobMatch[3]}-${dobMatch[4]}` : "",
    dateOfIssue: "",
    dateOfExpiry: expMatch ? `${expMatch[3]}-${expMatch[2]}-${expMatch[1]}` : "",
    gender,
    placeOfBirth: "",
    issuingCountry: upper.includes("ETHIOPIA") ? "Ethiopia" : "",
    confidenceScore,
  };
}

function normalizeResult(
  provider: PassportOcrResult["provider"],
  rawText: string,
  parsed: ParsedPassportFields,
  providerConfidence: number
): PassportOcrResult {
  const mrzValidated = Boolean(parsed.mrzLine1 && parsed.mrzLine2 && isMrzValidated(parsed.mrzLine1, parsed.mrzLine2));
  const confidenceScore = provider === "google" || mrzValidated ? 1 : Math.max(parsed.confidenceScore || 0, providerConfidence || 0);
  const amharicNames = extractAmharicNameFields(rawText);
  const warnings =
    confidenceScore < 0.7
      ? ["Low OCR confidence. Verify passport fields manually before saving."]
      : mrzValidated
        ? []
        : confidenceScore < 1
        ? ["OCR is high confidence but still requires human review for legal documents."]
        : [];

  return {
    provider,
    ...parsed,
    firstNameAmh: parsed.firstNameAmh || amharicNames.firstNameAmh,
    middleNameAmh: parsed.middleNameAmh || amharicNames.middleNameAmh,
    lastNameAmh: parsed.lastNameAmh || amharicNames.lastNameAmh,
    confidenceScore,
    rawText,
    multilingualText: extractMultilingualText(rawText),
    warnings,
  };
}

function parseRawPassportText(provider: PassportOcrResult["provider"], rawText: string, providerConfidence: number) {
  const mrz = extractMrz(rawText);
  const parsed = mrz ? parseMrz(mrz.line1, mrz.line2, rawText) : regexParse(rawText);

  // If regexParse was used, still try to extract additional fields
  if (!mrz) {
    const additional = extractAdditionalFields(rawText);
    parsed.dateOfIssue = additional.dateOfIssue || parsed.dateOfIssue;
    parsed.placeOfBirth = additional.placeOfBirth || parsed.placeOfBirth;
    parsed.placeOfIssue = additional.placeOfIssue || "Addis Ababa";
  }

  return normalizeResult(provider, rawText, parsed, providerConfidence);
}

async function parseWithGoogleVision(fileBuffer: Buffer): Promise<PassportOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("Google Vision OCR is selected but GOOGLE_VISION_API_KEY is not configured.");
  }

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: fileBuffer.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["en", "am", "ar"] },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Vision OCR error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  const firstResponse = data.responses?.[0];
  if (firstResponse?.error?.message) {
    throw new Error(`Google Vision OCR error: ${firstResponse.error.message}`);
  }

  const rawText = firstResponse?.fullTextAnnotation?.text || "";
  if (!rawText) {
    throw new Error("Google Vision returned no OCR text.");
  }

  const confidences =
    firstResponse?.fullTextAnnotation?.pages?.flatMap((page: any) =>
      page.blocks?.flatMap((block: any) =>
        block.paragraphs?.flatMap((paragraph: any) =>
          paragraph.words?.map((word: any) => word.confidence).filter((value: any) => typeof value === "number") || []
        ) || []
      ) || []
    ) || [];
  const providerConfidence =
    confidences.length > 0
      ? confidences.reduce((sum: number, value: number) => sum + value, 0) / confidences.length
      : 0.7;

  return parseRawPassportText("google", rawText, providerConfidence);
}

async function parseWithOcrSpace(fileBuffer: Buffer): Promise<PassportOcrResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("OCR.space is selected but OCR_SPACE_API_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("base64Image", `data:image/jpeg;base64,${fileBuffer.toString("base64")}`);
  formData.append("language", "eng");
  formData.append("isTable", "true");
  formData.append("OCREngine", "2");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR.space API error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  if (data.IsErroredOnProcessing || !data.ParsedResults?.length) {
    throw new Error(data.ErrorMessage || "OCR.space failed to parse the image.");
  }

  const rawText = data.ParsedResults.map((result: any) => result.ParsedText).join("\n");
  return parseRawPassportText("ocrspace", rawText, 0);
}

export async function parsePassportOcr(fileBuffer: Buffer): Promise<PassportOcrResult> {
  const provider = process.env.OCR_PROVIDER || "google";
  if (provider === "ocrspace") {
    return parseWithOcrSpace(fileBuffer);
  }
  return parseWithGoogleVision(fileBuffer);
}

