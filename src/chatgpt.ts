import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";

export const getChatGPTResponse = async (
  configuration: Configuration,
  messages: ChatCompletionRequestMessage[]
) => {
  const client = new OpenAIApi(configuration);

  const response = await client.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
  });

  return response.data.choices[0].message?.content;
};
