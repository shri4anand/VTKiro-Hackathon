declare module "text-readability" {
  const rs: {
    fleschKincaidGrade(text: string): number;
    [key: string]: unknown;
  };
  export default rs;
}
