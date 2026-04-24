package com.smartcampus.api.config;

import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Value("${app.seed.admin-name}")
    private String adminName;

    @Value("${app.seed.admin-employee-id:EMP-0001}")
    private String adminEmployeeId;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setName(adminName);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setAuthProvider(AuthProvider.LOCAL);
            admin.setEmailVerified(true);
            admin.setEmployeeId(adminEmployeeId);
            userRepository.save(admin);
            log.info("Seeded admin user: {} (employeeId={})", adminEmail, adminEmployeeId);
        }

        seedUser("student@test.com", "Test Student", "Student@1234!",
                Role.STUDENT, "STU-0001", null);
        seedUser("lecturer@test.com", "Test Lecturer", "Lecturer@1234!",
                Role.LECTURER, null, "EMP-0002");

        // Additional sample users to cover all 4 roles with multiple accounts each.
        seedUser("amali.student@test.com", "Amali Perera", "Student@1234!",
                Role.STUDENT, "STU-0002", null);
        seedUser("kasun.student@test.com", "Kasun Silva", "Student@1234!",
                Role.STUDENT, "STU-0003", null);
        seedUser("niranjan.lecturer@test.com", "Dr. Niranjan Fernando", "Lecturer@1234!",
                Role.LECTURER, null, "EMP-0003");
        seedUser("ravindu.tech@test.com", "Ravindu Jayasena", "Tech@1234!",
                Role.TECHNICAL_STAFF, null, "EMP-0004");
        seedUser("chamari.admin@test.com", "Chamari Wickramasinghe", "Admin@1234!",
                Role.ADMIN, null, "EMP-0005");
    }

    private void seedUser(String email, String name, String rawPassword, Role role,
                          String studentRegNo, String employeeId) {
        if (userRepository.findByEmail(email).isPresent()) return;
        if (studentRegNo != null && userRepository.existsByStudentRegistrationNumber(studentRegNo)) return;
        if (employeeId != null && userRepository.existsByEmployeeId(employeeId)) return;

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        if (studentRegNo != null) user.setStudentRegistrationNumber(studentRegNo);
        if (employeeId != null) user.setEmployeeId(employeeId);
        userRepository.save(user);
        log.info("Seeded {} user: {}", role, email);
    }
}
