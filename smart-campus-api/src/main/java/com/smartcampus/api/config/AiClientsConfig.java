package com.smartcampus.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class AiClientsConfig {

    @Bean("groqRestClient")
    public RestClient groqRestClient(AiProperties props) {
        return buildClient(props.groq() == null ? null : props.groq().baseUrl(), props);
    }

    @Bean("openaiRestClient")
    public RestClient openaiRestClient(AiProperties props) {
        return buildClient(props.openai() == null ? null : props.openai().baseUrl(), props);
    }

    private RestClient buildClient(String baseUrl, AiProperties props) {
        int timeoutMs = props.requestTimeoutMs() != null ? props.requestTimeoutMs() : 30_000;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));

        RestClient.Builder builder = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("Content-Type", "application/json");
        if (baseUrl != null && !baseUrl.isBlank()) {
            builder = builder.baseUrl(baseUrl);
        }
        return builder.build();
    }
}
