export interface OcrProvider {
  recognizeImage(localImageUri: string): Promise<string[]>;
}
