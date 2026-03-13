// CSS dosyalarının side-effect import'larına izin ver
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
