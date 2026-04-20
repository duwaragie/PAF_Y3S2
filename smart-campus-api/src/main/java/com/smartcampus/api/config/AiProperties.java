package com.smartcampus.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
        String provider,
        Groq groq,
        OpenAi openai,
        Integer maxToolIterations,
        Integer requestTimeoutMs
) {

    public record Groq(String apiKey, String baseUrl, String model) {}

    public record OpenAi(String apiKey, String baseUrl, String model) {}

    public boolean isOpenAi() {
        return "openai".equalsIgnoreCase(provider);
    }

    public String activeApiKey() {
        return isOpenAi() ? openai.apiKey() : groq.apiKey();
    }

    public String activeModel() {
        return isOpenAi() ? openai.model() : groq.model();
    }

    public String activeProviderName() {
        return isOpenAi() ? "openai" : "groq";
    }
}
