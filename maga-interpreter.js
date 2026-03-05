class MagaInterpreter {
  constructor() {
    this.variables = {};
    this.output = [];
  }

  tokenize(code) {
    const tokens = [];
    // Added % and | and & for logical ops, and made sure all operators are caught
    const regex = /(".*?"|\d+|[a-zA-Z_]\w*|==|!=|<=|>=|=|[{}();+\-*/<>!|&%])/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }

  skipBlock(tokens, pos) {
    // pos should be at '{'
    let depth = 1;
    pos++;
    while (depth > 0 && pos < tokens.length) {
      if (tokens[pos] === "{") depth++;
      if (tokens[pos] === "}") depth--;
      pos++;
    }
    return pos;
  }

  interpret(code) {
    this.variables = {};
    this.output = [];
    const tokens = this.tokenize(code);
    let pos = 0;

    if (tokens[pos] !== "shuru" || tokens[pos + 1] !== "maga") {
      throw new Error("Program must start with 'shuru maga'");
    }
    pos += 2;

    try {
      while (pos < tokens.length) {
        if (tokens[pos] === "mugisu" && tokens[pos + 1] === "maga") {
          break;
        }
        pos = this.executeStatement(tokens, pos);
      }
    } catch (e) {
      this.output.push("Error: " + e.message);
    }

    return this.output.join("\n");
  }

  executeStatement(tokens, pos) {
    const token = tokens[pos];

    if (token === "helu" && tokens[pos + 1] === "maga") {
      pos += 2;
      let exprTokens = [];
      while (tokens[pos] !== ";") {
        exprTokens.push(tokens[pos]);
        pos++;
      }
      const value = this.evaluateExpression(exprTokens);
      this.output.push(value);
      return pos + 1; // Skip ';'
    }

    if (tokens[pos + 1] === "=") {
      const varName = tokens[pos];
      pos += 2;
      let exprTokens = [];
      while (tokens[pos] !== ";") {
        exprTokens.push(tokens[pos]);
        pos++;
      }
      this.variables[varName] = this.evaluateExpression(exprTokens);
      return pos + 1; // Skip ';'
    }

    if (token === "maga") {
      pos += 1;
      let conditionTokens = [];
      while (tokens[pos] !== "adre" && pos < tokens.length) {
        conditionTokens.push(tokens[pos]);
        pos++;
      }
      const condition = !!this.evaluateExpression(conditionTokens);
      if (tokens[pos] === "adre") pos++; // Skip 'adre'
      if (tokens[pos] === "{") pos++; // Skip '{'

      if (condition) {
        while (pos < tokens.length && tokens[pos] !== "}") {
          pos = this.executeStatement(tokens, pos);
        }
        pos++; // Skip '}'

        // Skip following 'illandre maga ... adre' and 'illandre' blocks
        while (pos < tokens.length) {
          if (tokens[pos] === "illandre" && tokens[pos + 1] === "maga") {
            pos += 2;
            while (tokens[pos] !== "adre" && pos < tokens.length) pos++;
            if (tokens[pos] === "adre") pos++;
            pos = this.skipBlock(tokens, pos);
          } else if (tokens[pos] === "illandre" && tokens[pos + 1] === "maga") {
            // This case handles else without if (already handled above but being safe)
            pos += 2;
            while (tokens[pos] !== "{" && pos < tokens.length) pos++;
            pos = this.skipBlock(tokens, pos);
          } else {
            break;
          }
        }
      } else {
        // Skip the current true block
        pos = this.skipBlock(tokens, pos - 1);

        let handled = false;
        while (pos < tokens.length) {
          if (tokens[pos] === "illandre" && tokens[pos + 1] === "maga") {
            pos += 2;
            let isElseIf = false;
            let tempPos = pos;
            while (tokens[tempPos] !== "{" && tempPos < tokens.length) {
              if (tokens[tempPos] === "adre") {
                isElseIf = true;
                break;
              }
              tempPos++;
            }

            if (isElseIf) {
              let innerCondTokens = [];
              while (tokens[pos] !== "adre" && pos < tokens.length) {
                innerCondTokens.push(tokens[pos]);
                pos++;
              }
              const innerCondition = !!this.evaluateExpression(innerCondTokens);
              if (tokens[pos] === "adre") pos++; // skip adre
              if (tokens[pos] === "{") pos++; // skip {

              if (innerCondition && !handled) {
                while (tokens[pos] !== "}" && pos < tokens.length) {
                  pos = this.executeStatement(tokens, pos);
                }
                pos++; // Skip '}'
                handled = true;
              } else {
                pos = this.skipBlock(tokens, pos - 1);
              }
            } else {
              // It's a simple else: illandre maga {
              if (tokens[pos] === "{") pos++; // skip {
              if (!handled) {
                while (tokens[pos] !== "}" && pos < tokens.length) {
                  pos = this.executeStatement(tokens, pos);
                }
                pos++; // Skip '}'
                handled = true;
              } else {
                pos = this.skipBlock(tokens, pos - 1);
              }
              break;
            }
          } else {
            break;
          }
        }
      }
      return pos;
    }

    if (
      token === "repeate" &&
      tokens[pos + 1] === "madu" &&
      tokens[pos + 2] === "maga"
    ) {
      pos += 3;
      let conditionTokens = [];
      while (tokens[pos] !== "{" && pos < tokens.length) {
        conditionTokens.push(tokens[pos]);
        pos++;
      }
      let bodyStart = pos + 1; // Position after '{'
      let bodyEnd = this.skipBlock(tokens, pos) - 1; // Position of '}'

      while (this.evaluateExpression(conditionTokens)) {
        let currentPos = bodyStart;
        while (currentPos < bodyEnd) {
          currentPos = this.executeStatement(tokens, currentPos);
        }
      }
      return bodyEnd + 1; // Return position after '}'
    }

    // Default or unknown statement
    pos++;
    return pos;
  }

  evaluateExpression(tokens) {
    if (tokens.length === 0) return null;

    const expression = tokens
      .map((t) => {
        if (this.variables.hasOwnProperty(t)) {
          return JSON.stringify(this.variables[t]);
        }
        return t;
      })
      .join(" ");

    try {
      // Replace '==' with '===' and '!=' with '!=='
      let sanitized = expression.replace(/==|!=/g, (match) =>
        match === "==" ? "===" : "!==",
      );
      // Ensure strings are handled correctly if evaluation fails
      return eval(sanitized);
    } catch (e) {
      // If it's a simple string that failed eval (due to spaces/unexpected chars), return it as is or handle it
      // For now, if eval fails, we just return the joined string.
      return expression;
    }
  }
}
