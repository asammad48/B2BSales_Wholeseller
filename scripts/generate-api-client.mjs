import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(root, ".env") });

const swaggerUrl = process.env.VITE_SWAGGER_URL || process.env.SWAGGER_URL;
const outputPath = path.join(root, "src", "api", "generated", "apiClient.ts");
const tempConfigPath = path.join(root, "nswag.temp.json");

if (!swaggerUrl) {
  console.error("Missing VITE_SWAGGER_URL or SWAGGER_URL. Add it to your .env first.");
  process.exit(1);
}

const config = {
  runtime: "Net80",
  documentGenerator: {
    fromDocument: {
      url: swaggerUrl,
      output: null
    }
  },
  codeGenerators: {
openApiToTypeScriptClient: {
  className: "ApiClient",
  moduleName: "",
  namespace: "",
  typeScriptVersion: 5.0,
  template: "Axios",
  promiseType: "Promise",
  withCredentials: false,
      generateClientClasses: true,
      generateClientInterfaces: true,
      generateOptionalParameters: true,
      exportTypes: true,
      wrapDtoExceptions: false,
      exceptionClass: "ApiException",
      wrapResponses: false,
      generateResponseClasses: true,
      responseClass: "SwaggerResponse",
      markOptionalProperties: true,
      typeStyle: "Interface",
      enumStyle: "StringLiteral",
      operationGenerationMode: "MultipleClientsFromOperationId",
      namingStrategy: "Default",
      output: outputPath
    }
  }
};

await fs.writeFile(tempConfigPath, JSON.stringify(config, null, 2), "utf8");

console.log("Temporary NSwag config written:", tempConfigPath);
console.log("");
console.log("Run this next:");
console.log("  nswag run nswag.temp.json");
console.log("");
console.log("If NSwag is not installed:");
console.log("  dotnet tool install --global NSwag.ConsoleCore");
console.log("  nswag run nswag.temp.json");
console.log("");
console.log(`Generated file will be: ${outputPath}`);