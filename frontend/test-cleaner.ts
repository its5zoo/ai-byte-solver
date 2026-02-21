import { processAIResponse } from './src/lib/markdownCleaner';

const input1 = `**Explanation**\n\nIn C you typically store a string`;
console.log("Input 1:");
console.log(processAIResponse(input1));

const input2 = `**What caused the error?**\nThe compiler complained`;
console.log("\nInput 2:");
console.log(processAIResponse(input2));
