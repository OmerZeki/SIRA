import { parsePassportOcr } from "./src/lib/ocr";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  const imagePath = path.join(process.cwd(), "test.jpg");
  const buffer = fs.readFileSync(imagePath);
  try {
    const result = await parsePassportOcr(buffer);
    console.log("Extracted Fields:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error parsing OCR:", error);
  }
}

main();