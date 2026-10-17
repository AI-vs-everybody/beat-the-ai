declare module '*.txt' {
  const content: number | string; // Metro may return a numeric asset id
  export default content;
}
