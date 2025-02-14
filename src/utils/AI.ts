import OpenAI from "openai";

export default class AI {
  private client: OpenAI;
  private modelName: string;

  constructor(baseUrl: string, appKey: string, modelName: string) {
    this.modelName = modelName;
    this.client = new OpenAI({
      baseURL: baseUrl,
      apiKey: appKey
    });
  }

  public async chat(prompt: string): Promise<string | null> {
    const response = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.modelName
    });

    return response.choices[0].message.content;
  }
}
