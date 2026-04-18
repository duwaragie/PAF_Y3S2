package com.smartcampus.api.config;

import com.smartcampus.api.model.*;
import com.smartcampus.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Seeds sample facilities, bookings and their dependencies on first startup.
 * Each table is only seeded if empty — wipe the table via SQL if you want to regenerate.
 */
@Slf4j
@Component
@Profile("!test")
@Order(3)
@RequiredArgsConstructor
public class SampleDataInitializer implements ApplicationRunner {

    private final AssetRepository assetRepository;
    private final AmenityRepository amenityRepository;
    private final LocationRepository locationRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        Map<String, Asset> assets = seedAssets();
        Map<String, Amenity> amenities = seedAmenities();
        Map<String, Resource> resources = seedResources(assets, amenities);
        seedBookings(resources);
    }

    private Map<String, Asset> seedAssets() {
        Map<String, Asset> out = new HashMap<>();
        if (assetRepository.count() > 0) {
            assetRepository.findAll().forEach(a -> out.put(a.getName(), a));
            return out;
        }

        List<Asset> seeds = List.of(
                Asset.builder().name("Projector").description("Full HD ceiling-mounted projector").build(),
                Asset.builder().name("Smart Board").description("Interactive touchscreen whiteboard").build(),
                Asset.builder().name("3D Printer").description("Desktop FDM 3D printer").build(),
                Asset.builder().name("Whiteboard").description("Standard dry-erase whiteboard").build(),
                Asset.builder().name("Desktop Computer").description("Networked workstation PC").build()
        );
        assetRepository.saveAll(seeds).forEach(a -> out.put(a.getName(), a));
        log.info("Seeded {} assets.", out.size());
        return out;
    }

    private Map<String, Amenity> seedAmenities() {
        Map<String, Amenity> out = new HashMap<>();
        if (amenityRepository.count() > 0) {
            amenityRepository.findAll().forEach(a -> out.put(a.getName(), a));
            return out;
        }

        List<Amenity> seeds = List.of(
                Amenity.builder().name("AC").description("Air conditioning").build(),
                Amenity.builder().name("WiFi").description("High-speed wireless internet").build(),
                Amenity.builder().name("Power Sockets").description("Power outlets at every seat").build(),
                Amenity.builder().name("Wheelchair Access").description("Accessible to wheelchair users").build(),
                Amenity.builder().name("Natural Light").description("Large windows / daylight").build()
        );
        amenityRepository.saveAll(seeds).forEach(a -> out.put(a.getName(), a));
        log.info("Seeded {} amenities.", out.size());
        return out;
    }

    private Map<String, Resource> seedResources(Map<String, Asset> assets, Map<String, Amenity> amenities) {
        Map<String, Resource> out = new HashMap<>();
        if (resourceRepository.count() > 0) {
            resourceRepository.findAll().forEach(r -> out.put(r.getName(), r));
            return out;
        }

        List<Location> locations = locationRepository.findAll();
        if (locations.isEmpty()) {
            log.warn("Cannot seed sample resources — no locations found.");
            return out;
        }

        Function<String, Location> findLocation = roomNumber -> locations.stream()
                .filter(l -> roomNumber.equals(l.getRoomNumber()))
                .findFirst()
                .orElse(locations.get(0));

        List<Resource> toSave = new ArrayList<>();

        Resource r1 = Resource.builder()
                .name("Lecture Hall L101")
                .type(ResourceType.LECTURE_HALL)
                .capacity(100)
                .location(findLocation.apply("0101"))
                .status(ResourceStatus.ACTIVE)
                .assets(assetsOf(assets, "Projector", "Smart Board"))
                .amenities(amenitiesOf(amenities, "AC", "WiFi", "Power Sockets"))
                .build();
        r1.setAvailabilities(weeklyWindow(r1, DayOfWeek.MONDAY, DayOfWeek.FRIDAY, 8, 18));
        toSave.add(r1);

        Resource r2 = Resource.builder()
                .name("Computer Lab 102")
                .type(ResourceType.LAB)
                .capacity(30)
                .location(findLocation.apply("0102"))
                .status(ResourceStatus.ACTIVE)
                .assets(assetsOf(assets, "Desktop Computer", "Projector", "Whiteboard"))
                .amenities(amenitiesOf(amenities, "AC", "WiFi", "Power Sockets"))
                .build();
        r2.setAvailabilities(weeklyWindow(r2, DayOfWeek.MONDAY, DayOfWeek.SATURDAY, 8, 20));
        toSave.add(r2);

        Resource r3 = Resource.builder()
                .name("Meeting Room M203")
                .type(ResourceType.MEETING_ROOM)
                .capacity(8)
                .location(findLocation.apply("0203"))
                .status(ResourceStatus.ACTIVE)
                .assets(assetsOf(assets, "Smart Board", "Whiteboard"))
                .amenities(amenitiesOf(amenities, "AC", "WiFi"))
                .build();
        r3.setAvailabilities(weeklyWindow(r3, DayOfWeek.MONDAY, DayOfWeek.FRIDAY, 9, 17));
        toSave.add(r3);

        Resource r4 = Resource.builder()
                .name("Maker Space 304")
                .type(ResourceType.LAB)
                .capacity(20)
                .location(findLocation.apply("0304"))
                .status(ResourceStatus.UNDER_MAINTENANCE)
                .assets(assetsOf(assets, "3D Printer", "Desktop Computer"))
                .amenities(amenitiesOf(amenities, "Power Sockets", "Natural Light"))
                .build();
        r4.setAvailabilities(weeklyWindow(r4, DayOfWeek.MONDAY, DayOfWeek.FRIDAY, 10, 18));
        toSave.add(r4);

        Resource r5 = Resource.builder()
                .name("Portable Projector Kit")
                .type(ResourceType.EQUIPMENT)
                .capacity(null)
                .location(findLocation.apply("0103"))
                .status(ResourceStatus.OUT_OF_SERVICE)
                .assets(assetsOf(assets, "Projector"))
                .amenities(new HashSet<>())
                .availabilities(new ArrayList<>())
                .build();
        toSave.add(r5);

        resourceRepository.saveAll(toSave).forEach(r -> out.put(r.getName(), r));
        log.info("Seeded {} resources.", out.size());
        return out;
    }

    private void seedBookings(Map<String, Resource> resources) {
        if (bookingRepository.count() > 0) return;
        if (resources.isEmpty()) {
            log.warn("Cannot seed sample bookings — no resources found.");
            return;
        }

        Optional<User> student = userRepository.findByEmail("student@test.com");
        Optional<User> lecturer = userRepository.findByEmail("lecturer@test.com");
        Optional<User> admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .findFirst();

        if (student.isEmpty() || lecturer.isEmpty() || admin.isEmpty()) {
            log.warn("Cannot seed sample bookings — expected student/lecturer/admin users not found.");
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Booking> bookings = new ArrayList<>();

        // 1. PENDING — student requesting L101 for tomorrow afternoon
        bookings.add(Booking.builder()
                .user(student.get())
                .resource(resources.get("Lecture Hall L101"))
                .startTime(now.plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(1).withHour(16).withMinute(0).withSecond(0).withNano(0))
                .purpose("Team project kickoff for Software Engineering course")
                .expectedAttendees(8)
                .status(BookingStatus.PENDING)
                .build());

        // 2. APPROVED — lecturer's CS2042 lab session, already approved by admin
        Booking approved = Booking.builder()
                .user(lecturer.get())
                .resource(resources.get("Computer Lab 102"))
                .startTime(now.plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(2).withHour(12).withMinute(0).withSecond(0).withNano(0))
                .purpose("CS2042 practical lab session — algorithms")
                .expectedAttendees(25)
                .status(BookingStatus.APPROVED)
                .approvedBy(admin.get())
                .approvedAt(now.minusHours(3))
                .build();
        bookings.add(approved);

        // 3. REJECTED — student requested Meeting Room, admin declined with reason
        bookings.add(Booking.builder()
                .user(student.get())
                .resource(resources.get("Meeting Room M203"))
                .startTime(now.plusDays(3).withHour(9).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(3).withHour(17).withMinute(0).withSecond(0).withNano(0))
                .purpose("Study group")
                .expectedAttendees(4)
                .status(BookingStatus.REJECTED)
                .rejectionReason("Meeting rooms are reserved for faculty and staff during working hours.")
                .approvedBy(admin.get())
                .approvedAt(now.minusDays(1))
                .build());

        // 4. CANCELLED — student had an approved L101 booking next week but called it off
        bookings.add(Booking.builder()
                .user(student.get())
                .resource(resources.get("Lecture Hall L101"))
                .startTime(now.plusDays(7).withHour(13).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(7).withHour(15).withMinute(0).withSecond(0).withNano(0))
                .purpose("Guest speaker event — cancelled due to schedule change")
                .expectedAttendees(60)
                .status(BookingStatus.CANCELLED)
                .approvedBy(admin.get())
                .approvedAt(now.minusDays(2))
                .cancelledAt(now.minusHours(6))
                .build());

        // 5. PENDING — lecturer requesting M203 for department meeting
        bookings.add(Booking.builder()
                .user(lecturer.get())
                .resource(resources.get("Meeting Room M203"))
                .startTime(now.plusDays(4).withHour(11).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(4).withHour(12).withMinute(30).withSecond(0).withNano(0))
                .purpose("Department head sync — semester review")
                .expectedAttendees(6)
                .status(BookingStatus.PENDING)
                .build());

        bookingRepository.saveAll(bookings);
        log.info("Seeded {} bookings (PENDING × 2, APPROVED × 1, REJECTED × 1, CANCELLED × 1).", bookings.size());
    }

    private static Set<Asset> assetsOf(Map<String, Asset> all, String... names) {
        return Arrays.stream(names).map(all::get).filter(Objects::nonNull).collect(Collectors.toSet());
    }

    private static Set<Amenity> amenitiesOf(Map<String, Amenity> all, String... names) {
        return Arrays.stream(names).map(all::get).filter(Objects::nonNull).collect(Collectors.toSet());
    }

    private static List<ResourceAvailability> weeklyWindow(Resource resource, DayOfWeek from, DayOfWeek to, int startHour, int endHour) {
        List<ResourceAvailability> out = new ArrayList<>();
        for (DayOfWeek d = from; ; d = d.plus(1)) {
            out.add(ResourceAvailability.builder()
                    .resource(resource)
                    .dayOfWeek(d)
                    .startTime(LocalTime.of(startHour, 0))
                    .endTime(LocalTime.of(endHour, 0))
                    .build());
            if (d == to) break;
        }
        return out;
    }

    @FunctionalInterface
    private interface Function<T, R> {
        R apply(T t);
    }
}
