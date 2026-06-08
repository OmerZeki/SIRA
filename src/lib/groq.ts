interface ParsedNotes {
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | null;
  childrenCount: number | null;
  experienceYears: number | null;
  experienceCountries: string[] | null;
  religion: string | null;
  monthlySalaryExpected: number | null;
  languageArabic: "NONE" | "BASIC" | "GOOD" | "FLUENT" | null;
  languageEnglish: "NONE" | "BASIC" | "GOOD" | "FLUENT" | null;
  skills: {
    cleaning: boolean;
    cooking: boolean;
    arabicCooking: boolean;
    childrenCare: boolean;
    babySitting: boolean;
    elderCare: boolean;
    ironing: boolean;
    washing: boolean;
    tutoring: boolean;
    driving: boolean;
  };
  notes: string | null;
}

export async function parseAgentNotes(notesText: string): Promise<ParsedNotes> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "your-groq-api-key") {
    console.log("Groq API key not found or default. Running regex-based local parser fallback.");
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Rule-based regex parser
    const lowerText = notesText.toLowerCase();

    // Marital Status
    let maritalStatus: ParsedNotes["maritalStatus"] = null;
    if (lowerText.includes("single")) maritalStatus = "SINGLE";
    else if (lowerText.includes("married")) maritalStatus = "MARRIED";
    else if (lowerText.includes("divorced")) maritalStatus = "DIVORCED";
    else if (lowerText.includes("widow")) maritalStatus = "WIDOWED";

    // Children
    let childrenCount: number | null = null;
    const childMatch = lowerText.match(/(\d+)\s*(?:kid|child|children|son|daughter)/);
    if (childMatch) {
      childrenCount = parseInt(childMatch[1], 10);
    }

    // Experience Years
    let experienceYears: number | null = null;
    const expMatch = lowerText.match(/(\d+)\s*(?:year|yr)/);
    if (expMatch) {
      experienceYears = parseInt(expMatch[1], 10);
    }

    // Experience Countries
    const experienceCountries: string[] = [];
    const countries = ["dubai", "saudi", "riyadh", "kuwait", "qatar", "lebanon", "oman", "bahrain"];
    countries.forEach((country) => {
      if (lowerText.includes(country)) {
        experienceCountries.push(country.charAt(0).toUpperCase() + country.slice(1));
      }
    });

    // Religion
    let religion: string | null = null;
    if (lowerText.includes("christian") || lowerText.includes("orthodox") || lowerText.includes("protestant")) {
      religion = "Christian";
    } else if (lowerText.includes("muslim") || lowerText.includes("islam")) {
      religion = "Muslim";
    }

    // Salary
    let monthlySalaryExpected: number | null = null;
    const salaryMatch = lowerText.match(/(\d+)\s*(?:usd|sar|dollar|salary)/);
    if (salaryMatch) {
      monthlySalaryExpected = parseInt(salaryMatch[1], 10);
    }

    // Languages
    let languageArabic: ParsedNotes["languageArabic"] = "NONE";
    if (lowerText.includes("fluent arabic") || lowerText.includes("speak arabic well")) {
      languageArabic = "FLUENT";
    } else if (lowerText.includes("good arabic") || lowerText.includes("speaks arabic")) {
      languageArabic = "GOOD";
    } else if (lowerText.includes("basic arabic") || lowerText.includes("knows arabic")) {
      languageArabic = "BASIC";
    }

    let languageEnglish: ParsedNotes["languageEnglish"] = "NONE";
    if (lowerText.includes("fluent english") || lowerText.includes("speak english well")) {
      languageEnglish = "FLUENT";
    } else if (lowerText.includes("good english") || lowerText.includes("speaks english")) {
      languageEnglish = "GOOD";
    } else if (lowerText.includes("basic english") || lowerText.includes("knows english")) {
      languageEnglish = "BASIC";
    }

    // Skills
    const skills = {
      cleaning: lowerText.includes("clean") || lowerText.includes("housemaid") || lowerText.includes("housework"),
      cooking: lowerText.includes("cook") || lowerText.includes("food") || lowerText.includes("cooking"),
      arabicCooking: lowerText.includes("arabic cook") || lowerText.includes("arab food"),
      childrenCare: lowerText.includes("child") || lowerText.includes("baby"),
      babySitting: lowerText.includes("sit") || lowerText.includes("nanny"),
      elderCare: lowerText.includes("elder") || lowerText.includes("old"),
      ironing: lowerText.includes("iron"),
      washing: lowerText.includes("wash") || lowerText.includes("laundry"),
      tutoring: lowerText.includes("tutor") || lowerText.includes("teach"),
      driving: lowerText.includes("drive") || lowerText.includes("driver"),
    };

    return {
      maritalStatus,
      childrenCount,
      experienceYears,
      experienceCountries: experienceCountries.length > 0 ? experienceCountries : null,
      religion,
      monthlySalaryExpected,
      languageArabic,
      languageEnglish,
      skills,
      notes: notesText,
    };
  }

  // Real Groq API request
  try {
    const prompt = `You are a data extraction engine for SIRA, an Ethiopian recruitment agency.
Extract the following fields from the agent's notes and return ONLY valid JSON.
No explanations, no markdown. JSON only.

Schema:
{
  "maritalStatus": "SINGLE | MARRIED | DIVORCED | WIDOWED | null",
  "childrenCount": number | null,
  "experienceYears": number | null,
  "experienceCountries": ["Saudi Arabia", "Dubai", etc.] or null,
  "religion": "Christian | Muslim | null",
  "monthlySalaryExpected": number | null,
  "languageArabic": "NONE | BASIC | GOOD | FLUENT | null",
  "languageEnglish": "NONE | BASIC | GOOD | FLUENT | null",
  "skills": {
    "cleaning": boolean,
    "cooking": boolean,
    "arabicCooking": boolean,
    "childrenCare": boolean,
    "babySitting": boolean,
    "elderCare": boolean,
    "ironing": boolean,
    "washing": boolean,
    "tutoring": boolean,
    "driving": boolean
  },
  "notes": "cleaned up brief summary of notes in English | null"
}

Agent notes: "${notesText.replace(/"/g, '\\"')}"`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);

    return {
      maritalStatus: parsed.maritalStatus || null,
      childrenCount: parsed.childrenCount || null,
      experienceYears: parsed.experienceYears || null,
      experienceCountries: parsed.experienceCountries || null,
      religion: parsed.religion || null,
      monthlySalaryExpected: parsed.monthlySalaryExpected || null,
      languageArabic: parsed.languageArabic || null,
      languageEnglish: parsed.languageEnglish || null,
      skills: {
        cleaning: !!parsed.skills?.cleaning,
        cooking: !!parsed.skills?.cooking,
        arabicCooking: !!parsed.skills?.arabicCooking,
        childrenCare: !!parsed.skills?.childrenCare,
        babySitting: !!parsed.skills?.babySitting,
        elderCare: !!parsed.skills?.elderCare,
        ironing: !!parsed.skills?.ironing,
        washing: !!parsed.skills?.washing,
        tutoring: !!parsed.skills?.tutoring,
        driving: !!parsed.skills?.driving,
      },
      notes: parsed.notes || notesText,
    };
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}
