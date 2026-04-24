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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Seeds tickets, announcements, notifications, course offerings/sections/enrollments
 * with realistic data that covers every status/priority/category enum value.
 * Each table is gated on count() == 0, so reseeding requires truncating the table.
 */
@Slf4j
@Component
@Profile("!test")
@Order(10)
@RequiredArgsConstructor
public class ModuleSeedInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final ScheduledAnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final CourseOfferingRepository offeringRepository;
    private final CourseSectionRepository sectionRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedTickets();
        seedAnnouncements();
        seedNotifications();
        seedAcademics();
    }

    private void seedTickets() {
        if (ticketRepository.count() > 0) return;

        User student = userRepository.findByEmail("student@test.com").orElse(null);
        User lecturer = userRepository.findByEmail("lecturer@test.com").orElse(null);
        User tech = userRepository.findByEmail("ravindu.tech@test.com").orElse(null);
        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .findFirst().orElse(null);

        if (student == null || admin == null) {
            log.warn("Cannot seed tickets — required users not found.");
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Ticket> tickets = new ArrayList<>();

        tickets.add(Ticket.builder()
                .title("Lecture Hall L101 projector flickering")
                .location("Block A / Lecture Hall L101")
                .category(TicketCategory.ELECTRICAL)
                .description("Projector flickers every few minutes during morning lectures. Needs urgent inspection.")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .createdBy(lecturer != null ? lecturer : student)
                .preferredContactEmail("lecturer@test.com")
                .build());

        tickets.add(Ticket.builder()
                .title("Fire extinguisher missing from Block A floor 2")
                .location("Block A / Floor 2 corridor")
                .category(TicketCategory.SAFETY)
                .description("The fire extinguisher normally mounted near the stairwell is missing. Safety risk.")
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.IN_PROGRESS)
                .createdBy(admin)
                .assignedTo(tech)
                .assignedAt(now.minusHours(4))
                .build());

        tickets.add(Ticket.builder()
                .title("AC not cooling in Computer Lab 102")
                .location("Block A / Computer Lab 102")
                .category(TicketCategory.HVAC)
                .description("AC runs but room temperature stays above 28°C during lab sessions.")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.RESOLVED)
                .createdBy(student)
                .assignedTo(tech)
                .assignedAt(now.minusDays(3))
                .resolutionNotes("Serviced compressor and cleaned filters. Temperature now stable at 24°C.")
                .build());

        tickets.add(Ticket.builder()
                .title("Meeting Room M203 needs deep cleaning")
                .location("Block A / Meeting Room M203")
                .category(TicketCategory.CLEANING)
                .description("Carpet stains and dusty vents. Requested before next department meeting.")
                .priority(TicketPriority.LOW)
                .status(TicketStatus.CLOSED)
                .createdBy(lecturer != null ? lecturer : admin)
                .assignedTo(tech)
                .assignedAt(now.minusDays(7))
                .resolutionNotes("Deep-cleaned by facilities team. Confirmed by requester.")
                .build());

        tickets.add(Ticket.builder()
                .title("Desktops in Maker Space won't boot")
                .location("Block A / Maker Space 304")
                .category(TicketCategory.IT_EQUIPMENT)
                .description("Five workstations in Maker Space 304 fail to POST after the recent power outage.")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .createdBy(student)
                .build());

        tickets.add(Ticket.builder()
                .title("Request for a new coffee machine in staff lounge")
                .location("Block B / Staff Lounge")
                .category(TicketCategory.OTHER)
                .description("Current coffee machine is noisy. Requesting a replacement.")
                .priority(TicketPriority.LOW)
                .status(TicketStatus.REJECTED)
                .createdBy(lecturer != null ? lecturer : student)
                .rejectionReason("Procurement requests go through finance, not maintenance. Please file a purchase order.")
                .build());

        tickets.add(Ticket.builder()
                .title("Leaking tap in restroom near L201")
                .location("Block A / Floor 2 restroom (near L201)")
                .category(TicketCategory.PLUMBING)
                .description("Hot water tap leaks continuously even when closed tight.")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.IN_PROGRESS)
                .createdBy(admin)
                .assignedTo(tech)
                .assignedAt(now.minusHours(20))
                .build());

        tickets.add(Ticket.builder()
                .title("Broken chairs in Seminar Room S105")
                .location("Block A / Seminar Room S105")
                .category(TicketCategory.FURNITURE)
                .description("Three stacking chairs have broken backrests. Need replacements.")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .createdBy(student)
                .build());

        ticketRepository.saveAll(tickets);
        log.info("Seeded {} tickets across all statuses, priorities, and categories.", tickets.size());
    }

    private void seedAnnouncements() {
        if (announcementRepository.count() > 0) return;

        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .findFirst().orElse(null);

        LocalDateTime now = LocalDateTime.now();
        List<ScheduledAnnouncement> items = new ArrayList<>();

        // Already sent
        items.add(ScheduledAnnouncement.builder()
                .title("Campus closure Monday for scheduled maintenance")
                .message("The campus will be closed on Monday for electrical substation maintenance. All classes are moved online.")
                .priority(NotificationPriority.HIGH)
                .audience(AnnouncementAudience.ALL)
                .scheduledAt(now.minusDays(2))
                .sentAt(now.minusDays(2))
                .recipientCount(1200)
                .createdBy(admin)
                .build());

        items.add(ScheduledAnnouncement.builder()
                .title("Semester registration deadline reminder")
                .message("Please complete course registration before Friday 23:59 to avoid late fees.")
                .priority(NotificationPriority.MEDIUM)
                .audience(AnnouncementAudience.STUDENT)
                .scheduledAt(now.minusDays(1))
                .sentAt(now.minusDays(1))
                .recipientCount(850)
                .createdBy(admin)
                .build());

        items.add(ScheduledAnnouncement.builder()
                .title("Faculty meeting rescheduled to 15:00")
                .message("This week's faculty sync has been moved to 15:00 in the conference room.")
                .priority(NotificationPriority.LOW)
                .audience(AnnouncementAudience.LECTURER)
                .scheduledAt(now.minusHours(6))
                .sentAt(now.minusHours(6))
                .recipientCount(48)
                .createdBy(admin)
                .build());

        // Scheduled for future
        items.add(ScheduledAnnouncement.builder()
                .title("Annual sports day next Friday")
                .message("Join us for the annual inter-faculty sports day. Events start at 09:00 on the main grounds.")
                .priority(NotificationPriority.MEDIUM)
                .audience(AnnouncementAudience.ALL)
                .scheduledAt(now.plusDays(3))
                .createdBy(admin)
                .build());

        items.add(ScheduledAnnouncement.builder()
                .title("System maintenance window Saturday 02:00")
                .message("Admin portals will be unavailable for up to 2 hours on Saturday from 02:00 for scheduled upgrades.")
                .priority(NotificationPriority.HIGH)
                .audience(AnnouncementAudience.ADMIN)
                .scheduledAt(now.plusDays(2))
                .createdBy(admin)
                .build());

        items.add(ScheduledAnnouncement.builder()
                .title("Library hours extended during final exams")
                .message("The main library will be open until 23:00 every day during the upcoming final exam week.")
                .priority(NotificationPriority.LOW)
                .audience(AnnouncementAudience.STUDENT)
                .scheduledAt(now.plusDays(5))
                .createdBy(admin)
                .build());

        announcementRepository.saveAll(items);
        log.info("Seeded {} scheduled announcements (mix of sent and pending).", items.size());
    }

    private void seedNotifications() {
        if (notificationRepository.count() > 0) return;

        User student = userRepository.findByEmail("student@test.com").orElse(null);
        User lecturer = userRepository.findByEmail("lecturer@test.com").orElse(null);
        User tech = userRepository.findByEmail("ravindu.tech@test.com").orElse(null);

        if (student == null) {
            log.warn("Cannot seed notifications — student user not found.");
            return;
        }

        List<Notification> items = new ArrayList<>();

        items.add(Notification.builder()
                .recipient(student)
                .type(NotificationType.ENROLLMENT_CONFIRMED)
                .priority(NotificationPriority.MEDIUM)
                .title("Enrollment confirmed: IT3030")
                .message("You have successfully enrolled in IT3030 — Programming Application Frameworks (Section A).")
                .link("/enrollments")
                .read(false)
                .build());

        if (lecturer != null) {
            items.add(Notification.builder()
                    .recipient(lecturer)
                    .type(NotificationType.BOOKING_APPROVED)
                    .priority(NotificationPriority.MEDIUM)
                    .title("Booking approved: Computer Lab 102")
                    .message("Your booking for Computer Lab 102 on Wednesday 10:00–12:00 has been approved.")
                    .link("/bookings/my")
                    .read(true)
                    .readAt(LocalDateTime.now().minusHours(2))
                    .build());
        }

        if (tech != null) {
            items.add(Notification.builder()
                    .recipient(tech)
                    .type(NotificationType.TICKET_ASSIGNED)
                    .priority(NotificationPriority.HIGH)
                    .title("Ticket assigned: Fire extinguisher missing")
                    .message("A critical safety ticket has been assigned to you. Please investigate Block A floor 2.")
                    .link("/technician/dashboard")
                    .read(false)
                    .build());
        }

        items.add(Notification.builder()
                .recipient(student)
                .type(NotificationType.GRADE_RELEASED)
                .priority(NotificationPriority.MEDIUM)
                .title("Grade released: IT2030")
                .message("Your final grade for IT2030 has been released. Check your transcript for details.")
                .link("/transcript")
                .read(false)
                .build());

        items.add(Notification.builder()
                .recipient(student)
                .type(NotificationType.ANNOUNCEMENT)
                .priority(NotificationPriority.LOW)
                .title("Library hours extended during final exams")
                .message("The main library will be open until 23:00 during exam week.")
                .read(true)
                .readAt(LocalDateTime.now().minusDays(1))
                .build());

        items.add(Notification.builder()
                .recipient(student)
                .type(NotificationType.BOOKING_REJECTED)
                .priority(NotificationPriority.MEDIUM)
                .title("Booking rejected: Meeting Room M203")
                .message("Your booking request for Meeting Room M203 has been rejected. Meeting rooms are reserved for faculty.")
                .link("/bookings/my")
                .read(false)
                .build());

        items.add(Notification.builder()
                .recipient(student)
                .type(NotificationType.GENERAL)
                .priority(NotificationPriority.LOW)
                .title("Welcome to Smart Campus Hub")
                .message("Complete your profile to get the best experience.")
                .read(true)
                .readAt(LocalDateTime.now().minusDays(5))
                .build());

        notificationRepository.saveAll(items);
        log.info("Seeded {} notifications across different types and read states.", items.size());
    }

    private void seedAcademics() {
        if (offeringRepository.count() > 0) return;

        User lecturer = userRepository.findByEmail("lecturer@test.com").orElse(null);
        User lecturer2 = userRepository.findByEmail("niranjan.lecturer@test.com").orElse(null);
        Optional<User> student1 = userRepository.findByEmail("student@test.com");
        Optional<User> student2 = userRepository.findByEmail("amali.student@test.com");
        Optional<User> student3 = userRepository.findByEmail("kasun.student@test.com");

        if (lecturer == null || student1.isEmpty()) {
            log.warn("Cannot seed academics — required lecturer/student not found.");
            return;
        }

        List<CourseOffering> offerings = new ArrayList<>();

        CourseOffering it3030 = CourseOffering.builder()
                .code("IT3030")
                .title("Programming Application Frameworks")
                .description("Full-stack web development with Spring Boot and React.")
                .semester("Y3S2-2026")
                .credits(4.0)
                .prerequisites("IT2030")
                .status(CourseOfferingStatus.OPEN)
                .build();
        offerings.add(it3030);

        CourseOffering it3040 = CourseOffering.builder()
                .code("IT3040")
                .title("Software Engineering Project I")
                .description("Team-based industry capstone project.")
                .semester("Y3S2-2026")
                .credits(4.0)
                .prerequisites("IT3030")
                .status(CourseOfferingStatus.OPEN)
                .build();
        offerings.add(it3040);

        CourseOffering it3080 = CourseOffering.builder()
                .code("IT3080")
                .title("Web Application Development")
                .description("Modern web apps, deployment, and DevOps.")
                .semester("Y3S2-2026")
                .credits(3.0)
                .prerequisites(null)
                .status(CourseOfferingStatus.OPEN)
                .build();
        offerings.add(it3080);

        CourseOffering it2030 = CourseOffering.builder()
                .code("IT2030")
                .title("Data Structures and Algorithms")
                .description("Foundations of algorithmic problem solving.")
                .semester("Y3S1-2025")
                .credits(4.0)
                .prerequisites(null)
                .status(CourseOfferingStatus.CLOSED)
                .build();
        offerings.add(it2030);

        CourseOffering it3070 = CourseOffering.builder()
                .code("IT3070")
                .title("Information Security")
                .description("Security principles, cryptography, and secure system design.")
                .semester("Y4S1-2026")
                .credits(3.0)
                .prerequisites("IT2030")
                .status(CourseOfferingStatus.DRAFT)
                .build();
        offerings.add(it3070);

        CourseOffering it1010 = CourseOffering.builder()
                .code("IT1010")
                .title("Introduction to Programming")
                .description("First-year programming fundamentals in Python.")
                .semester("Y1S1-2024")
                .credits(3.0)
                .prerequisites(null)
                .status(CourseOfferingStatus.ARCHIVED)
                .build();
        offerings.add(it1010);

        offeringRepository.saveAll(offerings);

        List<CourseSection> sections = new ArrayList<>();
        sections.add(CourseSection.builder().offering(it3030).lecturer(lecturer).label("A").capacity(60).build());
        sections.add(CourseSection.builder().offering(it3040).lecturer(lecturer2 != null ? lecturer2 : lecturer).label("A").capacity(50).build());
        sections.add(CourseSection.builder().offering(it3080).lecturer(lecturer).label("A").capacity(40).build());
        sections.add(CourseSection.builder().offering(it2030).lecturer(lecturer).label("A").capacity(60).build());
        sections.add(CourseSection.builder().offering(it3070).lecturer(lecturer2 != null ? lecturer2 : lecturer).label("A").capacity(50).build());
        sections.add(CourseSection.builder().offering(it1010).lecturer(lecturer).label("A").capacity(80).build());
        sectionRepository.saveAll(sections);

        CourseSection it3030A = sections.get(0);
        CourseSection it3040A = sections.get(1);
        CourseSection it3080A = sections.get(2);
        CourseSection it2030A = sections.get(3);
        CourseSection it1010A = sections.get(5);

        List<Enrollment> enrollments = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        enrollments.add(Enrollment.builder()
                .student(student1.get()).section(it3030A)
                .status(EnrollmentStatus.ENROLLED)
                .gradeReleased(false)
                .build());

        enrollments.add(Enrollment.builder()
                .student(student1.get()).section(it2030A)
                .status(EnrollmentStatus.COMPLETED)
                .grade(Grade.A)
                .gradeReleased(true)
                .gradeReleasedAt(now.minusMonths(2))
                .build());

        enrollments.add(Enrollment.builder()
                .student(student1.get()).section(it1010A)
                .status(EnrollmentStatus.COMPLETED)
                .grade(Grade.B_PLUS)
                .gradeReleased(true)
                .gradeReleasedAt(now.minusMonths(12))
                .build());

        if (student2.isPresent()) {
            enrollments.add(Enrollment.builder()
                    .student(student2.get()).section(it3030A)
                    .status(EnrollmentStatus.WAITLISTED)
                    .gradeReleased(false)
                    .build());

            enrollments.add(Enrollment.builder()
                    .student(student2.get()).section(it2030A)
                    .status(EnrollmentStatus.WITHDRAWN)
                    .grade(Grade.W)
                    .gradeReleased(false)
                    .withdrawnAt(now.minusMonths(3))
                    .build());
        }

        if (student3.isPresent()) {
            enrollments.add(Enrollment.builder()
                    .student(student3.get()).section(it3040A)
                    .status(EnrollmentStatus.ENROLLED)
                    .gradeReleased(false)
                    .build());

            enrollments.add(Enrollment.builder()
                    .student(student3.get()).section(it3080A)
                    .status(EnrollmentStatus.ENROLLED)
                    .gradeReleased(false)
                    .build());
        }

        enrollmentRepository.saveAll(enrollments);
        log.info("Seeded {} course offerings, {} sections, and {} enrollments.",
                offerings.size(), sections.size(), enrollments.size());
    }
}
