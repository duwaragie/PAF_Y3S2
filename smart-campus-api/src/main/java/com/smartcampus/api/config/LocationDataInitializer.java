package com.smartcampus.api.config;

import com.smartcampus.api.model.Location;
import com.smartcampus.api.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
public class LocationDataInitializer implements CommandLineRunner {

    private final LocationRepository locationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (locationRepository.count() == 0) {
            List<Location> locations = new ArrayList<>();
            // roomType is retained for internal classification but not shown in displayName.
            String[] roomTypes = {"NORMAL", "AC", "LAB", "AC", "NORMAL"};

            for (int floor = 1; floor <= 4; floor++) {
                for (int room = 1; room <= 5; room++) {
                    String roomNumber = String.format("%02d", floor) + String.format("%02d", room);
                    String roomType = roomTypes[room - 1];

                    locations.add(Location.builder()
                            .block("Block A")
                            .floor(floor)
                            .roomNumber(roomNumber)
                            .roomType(roomType)
                            .build());
                }
            }
            locationRepository.saveAll(locations);
            System.out.println("Seeded " + locations.size() + " locations for Block A.");
        }
    }
}
