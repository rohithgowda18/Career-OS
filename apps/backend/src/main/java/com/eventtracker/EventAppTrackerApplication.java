package com.eventtracker;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.util.List;

@Slf4j
@SpringBootApplication
public class EventAppTrackerApplication {

    public static void main(String[] args) {
        log.info("[Startup Instrument] JVM main() entered at epoch ms: {}", System.currentTimeMillis());
        SpringApplication.run(EventAppTrackerApplication.class, args);
    }

    @EventListener(ApplicationStartedEvent.class)
    public void onApplicationStarted() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        log.info("[Startup Instrument] ApplicationStartedEvent fired - JVM Uptime: {}ms", uptime);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        log.info("[Startup Instrument] ApplicationReadyEvent fired - JVM Uptime: {}ms", uptime);

        // GC Metrics
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();
        long totalGcCount = 0;
        long totalGcTimeMs = 0;
        for (GarbageCollectorMXBean gcBean : gcBeans) {
            long count = gcBean.getCollectionCount();
            long time = gcBean.getCollectionTime();
            if (count > 0) totalGcCount += count;
            if (time > 0) totalGcTimeMs += time;
            log.info("[Startup Instrument] GC Collector [{}]: count={}, time={}ms", gcBean.getName(), count, time);
        }
        log.info("[Startup Instrument] Total Startup GC: count={}, time={}ms", totalGcCount, totalGcTimeMs);

        // Memory Metrics
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap = memoryMXBean.getHeapMemoryUsage();
        MemoryUsage nonHeap = memoryMXBean.getNonHeapMemoryUsage();
        log.info("[Startup Instrument] Heap Memory: used={}MB, committed={}MB, max={}MB",
                heap.getUsed() / (1024 * 1024),
                heap.getCommitted() / (1024 * 1024),
                heap.getMax() / (1024 * 1024));
        log.info("[Startup Instrument] Non-Heap Memory: used={}MB, committed={}MB, max={}MB",
                nonHeap.getUsed() / (1024 * 1024),
                nonHeap.getCommitted() / (1024 * 1024),
                nonHeap.getMax() / (1024 * 1024));
    }
}