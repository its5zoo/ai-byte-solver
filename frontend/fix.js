const content = `**Explanation**

In C you typically store a string (like a
name) in a character array. The array needs to
be large enough to hold the expected name plus
the terminating null-character (\`'\\0'\`). You
can read the name from the user with \`fgets\`
(safer) or \`scanf\`. After reading, you can
output a greeting using \`printf\`.`;

let html = content;
html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
console.log(html);
