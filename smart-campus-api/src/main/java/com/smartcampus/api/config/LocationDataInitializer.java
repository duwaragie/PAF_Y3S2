package com.smartcampus.api.config;

import com.smartcampus.api.model.Location;
import com.smartcampus.api.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LocationDataInitializer implements CommandLineRunner {

    private final LocationRepository locationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (locationRepository.count() == 0) {
            List<Location> locations = new ArrayList<>();
            String[] roomTypes = {"NORMAL", "AC", "LAB", "AC", "NORMAL", "NORMAL", "LAB", "NORMAL"};

            for (int floor = 1; floor <= 10; floor++) {
                for (int room = 1; room <= 8; room++) {
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
