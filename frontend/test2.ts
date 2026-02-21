import { processAIResponse } from './src/lib/markdownCleaner';

const input = `**Explanation**

In C you typically store a string (like a
name) in a character array. The array needs to
be large enough to hold the expected name plus
the terminating null-character (\`'\\0'\`). You
can read the name from the user with \`fgets\`
(safer) or \`scanf\`. After reading, you can
output a greeting using \`printf\`.

Key points:
- Declare a buffer: \`char name[50];\` - this
reserves space for up to 49 characters plus
the null terminator.
- Use \`fgets(name, sizeof(name), stdin);\` to
read the whole line, then remove the trailing
newline if present.
- Print the greeting: \`printf("Hi %s!\\n",
name);\`
- Always include \`<stdio.h>\` for I/O
functions.`;

console.log(processAIResponse(input));
