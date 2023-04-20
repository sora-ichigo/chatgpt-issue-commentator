import { OpenAIApi, Configuration } from "openai";

export const getChatGPTResponse = async (
  configuration: Configuration,
  message: string
) => {
  const client = new OpenAIApi(configuration);

  const response = await client.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  return response.data.choices[0].message?.content;
};
