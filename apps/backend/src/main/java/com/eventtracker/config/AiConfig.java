package com.eventtracker.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.time.Duration;

@Configuration
@Lazy
public class AiConfig {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            return (messages) -> {
                throw new IllegalStateException("Groq API Key is not configured. Please add groq.api.key to application.properties.");
            };
        }
        
        return OpenAiChatModel.builder()
                .apiKey(groqApiKey)
                .baseUrl("https://api.groq.com/openai/v1")
                .modelName("llama-3.1-70b-versatile")
                .timeout(Duration.ofSeconds(60))
                .maxTokens(2048)
                .build();
    }
}
