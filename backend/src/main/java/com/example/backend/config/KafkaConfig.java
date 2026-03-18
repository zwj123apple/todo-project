package com.example.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka配置类
 * 面试要点：
 * 1. Producer配置：序列化、acks、重试等
 * 2. Consumer配置：反序列化、group-id、offset等
 * 3. Topic创建和管理
 */
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9093}")
    private String bootstrapServers;

    /**
     * Producer配置
     * 面试重点：
     * - KEY_SERIALIZER_CLASS_CONFIG: Key的序列化器
     * - VALUE_SERIALIZER_CLASS_CONFIG: Value的序列化器
     * - ACKS_CONFIG: 消息确认机制 (0, 1, all)
     * - RETRIES_CONFIG: 重试次数
     */
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        
        // 消息确认机制：all表示所有副本都确认
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        
        // 重试次数
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        
        // 批量发送大小
        config.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        
        // 延迟时间
        config.put(ProducerConfig.LINGER_MS_CONFIG, 1);
        
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /**
     * Consumer配置
     * 面试重点：
     * - GROUP_ID_CONFIG: 消费者组ID
     * - AUTO_OFFSET_RESET_CONFIG: 偏移量重置策略 (earliest, latest, none)
     * - ENABLE_AUTO_COMMIT_CONFIG: 是否自动提交偏移量
     */
    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "todo-group");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        
        // 从最早的消息开始消费
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        
        // 自动提交偏移量
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        
        // 信任所有包（生产环境应该指定具体包）
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    /**
     * 创建Topic
     * 面试要点：
     * - partitions: 分区数，影响并行度
     * - replicas: 副本数，影响可靠性
     */
    @Bean
    public NewTopic taskCreatedTopic() {
        return TopicBuilder.name("task-created-topic")
                .partitions(3)  // 3个分区，提高并行处理能力
                .replicas(1)    // 1个副本（开发环境）
                .build();
    }

    @Bean
    public NewTopic taskUpdatedTopic() {
        return TopicBuilder.name("task-updated-topic")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic userNotificationTopic() {
        return TopicBuilder.name("user-notification-topic")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
