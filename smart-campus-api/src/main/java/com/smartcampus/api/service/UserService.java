package com.smartcampus.api.service;

import com.smartcampus.api.dto.ChangePasswordRequest;
import com.smartcampus.api.dto.CreateUserRequest;
import com.smartcampus.api.dto.UpdateProfileRequest;
import com.smartcampus.api.dto.UserDTO;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("email", email));
    }

    public UserDTO getUserByEmail(String email) {
        return convertToDTO(findByEmail(email));
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return convertToDTO(user);
    }

    public UserDTO convertToDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPicture(),
                user.getRole(),
                user.getAuthProvider(),
                user.isEmailVerified(),
                user.getStudentRegistrationNumber(),
                user.getEmployeeId(),
                isProfileComplete(user),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private boolean isProfileComplete(User user) {
        if (user.getRole() == Role.STUDENT) {
            return user.getStudentRegistrationNumber() != null && !user.getStudentRegistrationNumber().isBlank();
        }
        return user.getEmployeeId() != null && !user.getEmployeeId().isBlank();
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public UserDTO updateRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        user.setRole(newRole);
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO assignIdentifier(Long id, String studentRegistrationNumber, String employeeId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (studentRegistrationNumber != null && !studentRegistrationNumber.isBlank()) {
            String srn = studentRegistrationNumber.trim();
            if (!srn.equals(user.getStudentRegistrationNumber()) && userRepository.existsByStudentRegistrationNumber(srn)) {
                throw new RuntimeException("Registration number already in use.");
            }
            user.setStudentRegistrationNumber(srn);
        }
        if (employeeId != null && !employeeId.isBlank()) {
            String eid = employeeId.trim();
            if (!eid.equals(user.getEmployeeId()) && userRepository.existsByEmployeeId(eid)) {
                throw new RuntimeException("Employee ID already in use.");
            }
            user.setEmployeeId(eid);
        }
        return convertToDTO(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    public int deleteUsers(java.util.List<Long> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        java.util.List<User> found = userRepository.findAllById(ids);
        userRepository.deleteAll(found);
        return found.size();
    }

    public UserDTO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.setName(request.getName());
        if (request.getPicture() != null) {
            user.setPicture(request.getPicture());
        }

        // Students may self-assign their registration number (once). Staff cannot self-assign employeeId.
        if (request.getStudentRegistrationNumber() != null && !request.getStudentRegistrationNumber().isBlank()
                && user.getRole() == Role.STUDENT
                && (user.getStudentRegistrationNumber() == null || user.getStudentRegistrationNumber().isBlank())) {
            String srn = request.getStudentRegistrationNumber().trim();
            if (userRepository.existsByStudentRegistrationNumber(srn)) {
                throw new RuntimeException("Registration number already in use.");
            }
            user.setStudentRegistrationNumber(srn);
        }

        return convertToDTO(userRepository.save(user));
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new RuntimeException("Cannot change password for Google-only accounts.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("An account with this email already exists.");
        }
        if (request.getRole() == Role.STUDENT) {
            throw new RuntimeException("Cannot create STUDENT accounts via admin endpoint.");
        }
        String employeeId = request.getEmployeeId() != null ? request.getEmployeeId().trim() : "";
        if (employeeId.isBlank()) {
            throw new RuntimeException("Employee ID is required for staff accounts.");
        }
        if (userRepository.existsByEmployeeId(employeeId)) {
            throw new RuntimeException("Employee ID already in use.");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setEmployeeId(employeeId);
        return convertToDTO(userRepository.save(user));
    }
}
