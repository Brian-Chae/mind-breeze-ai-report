/**
 * JSON 구문 오류 자동 수정 유틸리티
 * AI 응답에서 발생하는 일반적인 JSON 구문 오류를 감지하고 수정
 */

export interface SanitizationResult {
  success: boolean;
  sanitizedText: string;
  errors: string[];
  warnings: string[];
  appliedFixes: string[];
}

export class JSONSanitizer {
  /**
   * JSON 텍스트의 구문 오류를 수정
   */
  static sanitizeJSON(jsonText: string): SanitizationResult {
    const result: SanitizationResult = {
      success: false,
      sanitizedText: jsonText,
      errors: [],
      warnings: [],
      appliedFixes: []
    };

    try {
      let sanitized = jsonText;

      // 1. 기본 정리 (공백, 개행, 마크다운 등)
      sanitized = this.basicCleanup(sanitized, result);

      // 2. 마크다운 코드 블록 및 언어 태그 제거 (강화)
      sanitized = this.removeMarkdownBlocks(sanitized, result);

      // 3. 문자열 내 특수문자 이스케이프 (강화)
      sanitized = this.fixStringEscaping(sanitized, result);

      // 4. 배열 요소 간 콤마 누락 수정
      sanitized = this.fixArrayCommas(sanitized, result);

      // 5. 객체 속성 간 콤마 누락 수정
      sanitized = this.fixObjectCommas(sanitized, result);

      // 6. 중복 콤마 제거
      sanitized = this.removeDuplicateCommas(sanitized, result);

      // 7. 불완전한 괄호 수정
      sanitized = this.fixBrackets(sanitized, result);

      // 8. 후행 콤마 제거
      sanitized = this.removeTrailingCommas(sanitized, result);

      // 9. 잘린 JSON 수정 (AI 응답 제한으로 인한 불완전한 JSON)
      sanitized = this.fixTruncatedJSON(sanitized, result);

      // 10. 문자열 값 내 개행 처리 (강화)
      sanitized = this.fixMultilineStrings(sanitized, result);

      // 11. 잘못된 속성명 수정
      sanitized = this.fixPropertyNames(sanitized, result);

      // 12. 최종 검증 시도
      try {
        JSON.parse(sanitized);
        result.success = true;
        result.sanitizedText = sanitized;
      } catch (error) {
        // 최종 시도: 더 공격적인 수정
        sanitized = this.aggressiveRepair(sanitized, result);
        try {
          JSON.parse(sanitized);
          result.success = true;
          result.sanitizedText = sanitized;
        } catch (finalError) {
          result.errors.push(`최종 JSON 파싱 실패: ${finalError instanceof Error ? finalError.message : '알 수 없는 오류'}`);
          result.success = false;
        }
      }

    } catch (error) {
      result.errors.push(`JSON 정리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 기본 정리 (불필요한 공백, 개행 등)
   */
  private static basicCleanup(text: string, result: SanitizationResult): string {
    let cleaned = text;

    // 앞뒤 공백 제거
    const trimmed = cleaned.trim();
    if (trimmed !== cleaned) {
      cleaned = trimmed;
      result.appliedFixes.push('앞뒤 공백 제거');
    }

    return cleaned;
  }

  /**
   * 마크다운 코드 블록 제거 (강화)
   */
  private static removeMarkdownBlocks(text: string, result: SanitizationResult): string {
    let cleaned = text;

    // 다양한 마크다운 패턴 제거
    const patterns = [
      { pattern: /```json\s*/g, name: '```json 태그' },
      { pattern: /```javascript\s*/g, name: '```javascript 태그' },
      { pattern: /```\s*json\s*/g, name: '```json 태그 (공백 포함)' },
      { pattern: /\s*```\s*$/g, name: '끝 ``` 태그' },
      { pattern: /```/g, name: '일반 ``` 태그' },
      { pattern: /^json\s*\n/gm, name: '시작 json 라벨' },
      { pattern: /^JSON\s*\n/gm, name: '시작 JSON 라벨' }
    ];

    for (const { pattern, name } of patterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '');
        result.appliedFixes.push(`${name} 제거`);
      }
    }

    return cleaned;
  }

  /**
   * 문자열 이스케이프 문제 수정 (강화)
   */
  private static fixStringEscaping(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 1. 이스케이프되지 않은 개행 문자 수정
    const unescapedNewlinePattern = /"([^"\\]*?)(\n)([^"\\]*?)"/g;
    let newlineMatches = 0;
    fixed = fixed.replace(unescapedNewlinePattern, (match, before, newline, after) => {
      newlineMatches++;
      return `"${before}\\n${after}"`;
    });
    if (newlineMatches > 0) {
      result.appliedFixes.push(`이스케이프되지 않은 개행 수정 (${newlineMatches}개)`);
    }

    // 2. 이스케이프되지 않은 따옴표 수정
    const unescapedQuotePattern = /("(?:[^"\\]|\\.)*?)([^\\])"([^:,\]}])/g;
    let quoteMatches = 0;
    fixed = fixed.replace(unescapedQuotePattern, (match, before, char, after) => {
      quoteMatches++;
      return `${before}${char}\\"${after}`;
    });
    if (quoteMatches > 0) {
      result.appliedFixes.push(`이스케이프되지 않은 따옴표 수정 (${quoteMatches}개)`);
    }

    // 3. 이스케이프되지 않은 백슬래시 수정
    const unescapedBackslashPattern = /("(?:[^"\\]|\\.)*?)([^\\])\\([^"\\nrt])/g;
    let backslashMatches = 0;
    fixed = fixed.replace(unescapedBackslashPattern, (match, before, char, after) => {
      backslashMatches++;
      return `${before}${char}\\\\${after}`;
    });
    if (backslashMatches > 0) {
      result.appliedFixes.push(`이스케이프되지 않은 백슬래시 수정 (${backslashMatches}개)`);
    }

    return fixed;
  }

  /**
   * 다중 라인 문자열 처리 (강화)
   */
  private static fixMultilineStrings(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 문자열 내부의 실제 개행을 \\n으로 변환
    const multilineStringPattern = /"([^"]*?)\n([^"]*?)"/g;
    let multilineMatches = 0;
    fixed = fixed.replace(multilineStringPattern, (match, before, after) => {
      multilineMatches++;
      return `"${before}\\n${after}"`;
    });
    if (multilineMatches > 0) {
      result.appliedFixes.push(`다중 라인 문자열 수정 (${multilineMatches}개)`);
    }

    return fixed;
  }

  /**
   * 잘못된 속성명 수정
   */
  private static fixPropertyNames(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 따옴표 없는 속성명 수정
    const unquotedPropertyPattern = /(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g;
    let propertyMatches = 0;
    fixed = fixed.replace(unquotedPropertyPattern, (match, whitespace, propertyName, offset) => {
      // JSON의 시작이나 객체 내부에서만 수정
      const before = fixed.substring(0, offset);
      const isInObject = before.includes('{') && !before.includes('}');
      if (isInObject) {
        propertyMatches++;
        return `${whitespace}"${propertyName}":`;
      }
      return match;
    });
    if (propertyMatches > 0) {
      result.appliedFixes.push(`따옴표 없는 속성명 수정 (${propertyMatches}개)`);
    }

    return fixed;
  }

  /**
   * 배열 요소 간 콤마 누락 수정
   */
  private static fixArrayCommas(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 패턴: "value"\n  "nextValue" → "value",\n  "nextValue"
    const arrayElementPattern = /("(?:[^"\\]|\\.)*")\s*\n\s*("(?:[^"\\]|\\.)*")/g;
    const arrayElementMatches = fixed.match(arrayElementPattern);
    if (arrayElementMatches) {
      fixed = fixed.replace(arrayElementPattern, '$1,\n  $2');
      result.appliedFixes.push(`배열 요소 간 콤마 추가 (${arrayElementMatches.length}개)`);
    }

    // 패턴: }\n  { → },\n  {
    const objectElementPattern = /}\s*\n\s*{/g;
    const objectElementMatches = fixed.match(objectElementPattern);
    if (objectElementMatches) {
      fixed = fixed.replace(objectElementPattern, '},\n  {');
      result.appliedFixes.push(`객체 요소 간 콤마 추가 (${objectElementMatches.length}개)`);
    }

    // 패턴: ]\n  "nextProperty" → ],\n  "nextProperty"
    const arrayEndPattern = /]\s*\n\s*"/g;
    const arrayEndMatches = fixed.match(arrayEndPattern);
    if (arrayEndMatches) {
      fixed = fixed.replace(arrayEndPattern, '],\n  "');
      result.appliedFixes.push(`배열 종료 후 콤마 추가 (${arrayEndMatches.length}개)`);
    }

    return fixed;
  }

  /**
   * 객체 속성 간 콤마 누락 수정
   */
  private static fixObjectCommas(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 패턴: "value"\n  "property": → "value",\n  "property":
    const propertyPattern = /("(?:[^"\\]|\\.)*")\s*\n\s*("(?:[^"\\]|\\.)*"\s*:)/g;
    const propertyMatches = fixed.match(propertyPattern);
    if (propertyMatches) {
      fixed = fixed.replace(propertyPattern, '$1,\n  $2');
      result.appliedFixes.push(`객체 속성 간 콤마 추가 (${propertyMatches.length}개)`);
    }

    // 패턴: 숫자 뒤 속성 - 123\n  "property": → 123,\n  "property":
    const numberPropertyPattern = /(\d+)\s*\n\s*("(?:[^"\\]|\\.)*"\s*:)/g;
    const numberPropertyMatches = fixed.match(numberPropertyPattern);
    if (numberPropertyMatches) {
      fixed = fixed.replace(numberPropertyPattern, '$1,\n  $2');
      result.appliedFixes.push(`숫자 값 후 콤마 추가 (${numberPropertyMatches.length}개)`);
    }

    // 패턴: boolean 뒤 속성 - true\n  "property": → true,\n  "property":
    const booleanPropertyPattern = /(true|false)\s*\n\s*("(?:[^"\\]|\\.)*"\s*:)/g;
    const booleanPropertyMatches = fixed.match(booleanPropertyPattern);
    if (booleanPropertyMatches) {
      fixed = fixed.replace(booleanPropertyPattern, '$1,\n  $2');
      result.appliedFixes.push(`boolean 값 후 콤마 추가 (${booleanPropertyMatches.length}개)`);
    }

    return fixed;
  }

  /**
   * 중복 콤마 제거
   */
  private static removeDuplicateCommas(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 연속된 콤마 제거
    const duplicateCommaPattern = /,\s*,+/g;
    const duplicateCommaMatches = fixed.match(duplicateCommaPattern);
    if (duplicateCommaMatches) {
      fixed = fixed.replace(duplicateCommaPattern, ',');
      result.appliedFixes.push(`중복 콤마 제거 (${duplicateCommaMatches.length}개)`);
    }

    return fixed;
  }

  /**
   * 불완전한 괄호 수정
   */
  private static fixBrackets(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 기본적인 괄호 균형 확인 및 수정
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    // 중괄호 불균형 수정
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      fixed += '}'.repeat(missing);
      result.appliedFixes.push(`누락된 중괄호 추가 (${missing}개)`);
    }

    // 대괄호 불균형 수정
    if (openBrackets > closeBrackets) {
      const missing = openBrackets - closeBrackets;
      fixed += ']'.repeat(missing);
      result.appliedFixes.push(`누락된 대괄호 추가 (${missing}개)`);
    }

    return fixed;
  }

  /**
   * 후행 콤마 제거
   */
  private static removeTrailingCommas(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 객체 끝의 후행 콤마 제거
    const trailingObjectCommaPattern = /,(\s*})/g;
    const trailingObjectCommaMatches = fixed.match(trailingObjectCommaPattern);
    if (trailingObjectCommaMatches) {
      fixed = fixed.replace(trailingObjectCommaPattern, '$1');
      result.appliedFixes.push(`객체 후행 콤마 제거 (${trailingObjectCommaMatches.length}개)`);
    }

    // 배열 끝의 후행 콤마 제거
    const trailingArrayCommaPattern = /,(\s*])/g;
    const trailingArrayCommaMatches = fixed.match(trailingArrayCommaPattern);
    if (trailingArrayCommaMatches) {
      fixed = fixed.replace(trailingArrayCommaPattern, '$1');
      result.appliedFixes.push(`배열 후행 콤마 제거 (${trailingArrayCommaMatches.length}개)`);
    }

    return fixed;
  }

  /**
   * 잘린 JSON 수정 (AI 응답 제한으로 인한 불완전한 JSON)
   */
  private static fixTruncatedJSON(text: string, result: SanitizationResult): string {
    let fixed = text;

    // 1. 불완전한 문자열 감지 및 수정
    // 패턴: "텍스트가 중간에 끝남... 으로 끝나는 경우
    if (fixed.includes('...') && !fixed.endsWith('}') && !fixed.endsWith(']')) {
      // 마지막 불완전한 문자열을 찾아서 닫기
      const lastQuoteIndex = fixed.lastIndexOf('"');
      const beforeLastQuote = fixed.substring(0, lastQuoteIndex);
      const afterLastQuote = fixed.substring(lastQuoteIndex + 1);
      
      // 만약 마지막 따옴표 후에 완전하지 않은 텍스트가 있다면
      if (afterLastQuote && !afterLastQuote.includes('"') && !afterLastQuote.includes('}')) {
        // 불완전한 부분을 제거하고 문자열을 닫음
        fixed = beforeLastQuote + '"';
        result.appliedFixes.push('불완전한 문자열 끝부분 수정');
      }
    }

    // 2. 중간에 끊어진 문자열 수정
    // 패턴: "분석 내용이 여기서 끊어짐 (따옴표 없이 끝남)
    const incompleteStringPattern = /"[^"]*$/;
    if (incompleteStringPattern.test(fixed)) {
      fixed = fixed + '"';
      result.appliedFixes.push('불완전한 문자열에 닫는 따옴표 추가');
    }

    // 3. 불완전한 객체나 배열 구조 완성
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    // 누락된 닫는 괄호들 추가
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      fixed += '}'.repeat(missing);
      result.appliedFixes.push(`잘린 JSON에 누락된 중괄호 추가 (${missing}개)`);
    }

    if (openBrackets > closeBrackets) {
      const missing = openBrackets - closeBrackets;
      fixed += ']'.repeat(missing);
      result.appliedFixes.push(`잘린 JSON에 누락된 대괄호 추가 (${missing}개)`);
    }

    // 4. 마지막 속성 값이 불완전한 경우 처리
    // 패턴: "property": "value가 여기서 끊어짐
    const incompletePropertyPattern = /:\s*"[^"]*$/;
    if (incompletePropertyPattern.test(fixed)) {
      fixed = fixed + '"';
      result.appliedFixes.push('불완전한 속성 값에 닫는 따옴표 추가');
    }

    return fixed;
  }

  /**
   * 공격적인 JSON 수정 (최후의 수단)
   */
  private static aggressiveRepair(text: string, result: SanitizationResult): string {
    let fixed = text;

    try {
      // 1. 마지막 불완전한 속성 제거
      const lastCommaIndex = fixed.lastIndexOf(',');
      const lastBraceIndex = fixed.lastIndexOf('}');
      
      if (lastCommaIndex > lastBraceIndex) {
        // 마지막 콤마 이후 내용이 불완전할 가능성
        const afterLastComma = fixed.substring(lastCommaIndex + 1).trim();
        if (!afterLastComma.includes(':') || !afterLastComma.includes('"')) {
          fixed = fixed.substring(0, lastCommaIndex);
          result.appliedFixes.push('불완전한 마지막 속성 제거');
        }
      }

      // 2. 괄호 균형 재조정
      const openBraces = (fixed.match(/{/g) || []).length;
      const closeBraces = (fixed.match(/}/g) || []).length;
      
      if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces);
        result.appliedFixes.push('공격적 괄호 균형 조정');
      }

      // 3. 최종 검증을 위한 간단한 구조 확인
      if (!fixed.trim().startsWith('{') && !fixed.trim().startsWith('[')) {
        fixed = '{' + fixed;
        result.appliedFixes.push('시작 중괄호 추가');
      }

      if (!fixed.trim().endsWith('}') && !fixed.trim().endsWith(']')) {
        fixed = fixed + '}';
        result.appliedFixes.push('끝 중괄호 추가');
      }

    } catch (error) {
      result.warnings.push('공격적 수정 중 오류 발생');
    }

    return fixed;
  }

  /**
   * JSON 구조 유효성 빠른 검사
   */
  static isValidJSONStructure(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * JSON 파싱 오류 상세 분석
   */
  static analyzeJSONError(text: string): { line: number; column: number; message: string; context?: string } | null {
    try {
      JSON.parse(text);
      return null;
    } catch (error) {
      if (error instanceof SyntaxError) {
        const message = error.message;
        
        // 위치 정보 추출 시도
        const positionMatch = message.match(/position (\d+)/);
        const lineColumnMatch = message.match(/line (\d+) column (\d+)/);
        
        let line = 0, column = 0, context = '';
        
        if (lineColumnMatch) {
          line = parseInt(lineColumnMatch[1]);
          column = parseInt(lineColumnMatch[2]);
        } else if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const lines = text.substring(0, position).split('\n');
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
        }
        
        // 오류 컨텍스트 추출
        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const start = Math.max(0, position - 50);
          const end = Math.min(text.length, position + 50);
          context = text.substring(start, end);
        }
        
        return { line, column, message, context };
      }
      return null;
    }
  }
} 