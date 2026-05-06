import TextRecognition from "@react-native-ml-kit/text-recognition";

import type { OcrProvider } from "./ocrProvider";

export class MlKitOcrProvider implements OcrProvider {
  async recognizeImage(localImageUri: string): Promise<string[]> {
    const result = await TextRecognition.recognize(localImageUri);
    return result.blocks.map((block) => block.text).filter(Boolean);
  }
}
