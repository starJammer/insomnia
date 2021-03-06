/**
 * Format a JSON string without parsing it as JavaScript.
 *
 * Code taken from jsonlint (http://zaa.ch/jsonlint/)
 *
 * @param json
 * @param indentChars
 * @returns {string}
 */
export function prettifyJson (json, indentChars = '\t') {
  // Convert the unicode. To correctly mimic JSON.stringify(JSON.parse(json), null, indentChars)
  // we need to convert all escaped unicode characters to proper unicode characters.
  try {
    json = _convertUnicode(json);
  } catch (err) {
    // Just in case (should never happen)
    console.warn('Prettify failed to handle unicode', err);
  }

  let i = 0;
  let il = json.length;
  let tab = indentChars;
  let newJson = '';
  let indentLevel = 0;
  let inString = false;
  let isEscaped = false;
  let currentChar = null;
  let previousChar = null;
  let nextChar = null;

  for (; i < il; i += 1) {
    currentChar = json.charAt(i);
    previousChar = json.charAt(i - 1);
    nextChar = json.charAt(i + 1);

    // Handle the escaped case
    if (isEscaped) {
      isEscaped = false;
      newJson += currentChar;
      continue;
    }

    switch (currentChar) {
      case '\\':
        isEscaped = !isEscaped;
        newJson += currentChar;
        break;
      case '{':
        if (!inString && nextChar !== '}') {
          newJson += currentChar + '\n' + _repeatString(tab, indentLevel + 1);
          indentLevel += 1;
        } else {
          newJson += currentChar;
        }
        break;
      case '[':
        if (!inString && nextChar !== ']') {
          newJson += currentChar + '\n' + _repeatString(tab, indentLevel + 1);
          indentLevel += 1;
        } else {
          newJson += currentChar;
        }
        break;
      case '}':
        if (!inString && previousChar !== '{') {
          indentLevel -= 1;
          newJson += '\n' + _repeatString(tab, indentLevel) + currentChar;
        } else {
          newJson += currentChar;
        }
        break;
      case ']':
        if (!inString && previousChar !== '[') {
          indentLevel -= 1;
          newJson += '\n' + _repeatString(tab, indentLevel) + currentChar;
        } else {
          newJson += currentChar;
        }
        break;
      case ',':
        if (!inString) {
          newJson += ',\n' + _repeatString(tab, indentLevel);
        } else {
          newJson += currentChar;
        }
        break;
      case ':':
        if (!inString) {
          newJson += ': ';
        } else {
          newJson += currentChar;
        }
        break;
      case ' ':
      case '\n':
      case '\t':
        if (inString) {
          newJson += currentChar;
        }
        break;
      case '"':
        inString = !inString;
        newJson += currentChar;
        break;
      case '\r':
        // Skip windows return characters
        break;
      default:
        newJson += currentChar;
        break;
    }
  }

  // Remove lines that only contain whitespace
  return newJson.replace(/^\s*\n/gm, '');
}

function _repeatString (s, count) {
  return new Array(count + 1).join(s);
}

/**
 * Convert escaped unicode characters to real characters. Any JSON parser will do this by
 * default. This is really fast too. Around 25ms for ~2MB of data with LOTS of unicode.
 *
 * @param originalStr
 * @returns {string}
 * @private
 */
function _convertUnicode (originalStr) {
  let m;
  let c;
  let lastI = 0;

  // Matches \u####
  const unicodeRegex = /\\u([0-9a-fA-F]{4})/g;

  let convertedStr = '';
  while ((m = unicodeRegex.exec(originalStr))) {
    try {
      c = String.fromCharCode(parseInt(m[1], 16));
      if (c === '"') {
        // Escape it if it's double quotes
        c = `\\${c}`;
      }
      convertedStr += originalStr.slice(lastI, m.index) + c;
      lastI = m.index + m[0].length;
    } catch (err) {
      // Some reason we couldn't convert a char. Should never actually happen
      console.warn('Failed to convert unicode char', m[1], err);
    }
  }

  // Finally, add the rest of the string to the end.
  convertedStr += originalStr.slice(lastI, originalStr.length);

  return convertedStr;
}
