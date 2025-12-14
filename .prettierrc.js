module.exports = {
  // セミコロンをつけない (JavaScriptの慣習に従う)
  semi: false,
  // シングルクォートを使用
  singleQuote: true,
  // trailing commasをES5に準拠させる（オブジェクトや配列の末尾）
  trailingComma: 'es5',
  // オブジェクトのキーに引用符を必要としない (as-needed)
  quoteProps: 'as-needed',
  // タブではなくスペースを使用
  useTabs: false,
  // インデントの幅を2スペースに設定
  tabWidth: 2,
  // 行の最大長を100文字に設定
  printWidth: 100,
  // JSXの閉じ括弧を改行せず同一行に配置
  jsxBracketSameLine: false,
  // Arrow functionの引数が一つでも括弧をつける
  arrowParens: 'always',
  // Markdownファイルでも整形を適用
  proseWrap: 'preserve',
  // HTML空白文字の扱い
  htmlWhitespaceSensitivity: 'css',
  // 改行コードLFを強制
  endOfLine: 'lf',
};
