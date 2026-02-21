import { processAIResponse } from './src/lib/markdownCleaner';

const input = `\`\`\`json
{
  "explanation": "**Explanation**\\n\\nIn C you typically store a string...",
  "code": "#include <stdio.h>\nint main() { printf(\\"Hi\\"); return 0; }"
}
\`\`\``;

console.log(processAIResponse(input));
