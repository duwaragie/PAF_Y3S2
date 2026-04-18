package com.smartcampus.api.service;

import com.smartcampus.api.dto.CourseOfferingDTO;
import com.smartcampus.api.dto.CreateCourseOfferingRequest;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.CourseOffering;
import com.smartcampus.api.model.CourseOfferingStatus;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.CourseOfferingRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseOfferingService {

    private final CourseOfferingRepository courseOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public CourseOfferingDTO create(CreateCourseOfferingRequest request) {
        courseOfferingRepository.findByCodeAndSemester(request.getCode(), request.getSemester())
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "A course offering with code " + request.getCode()
                                    + " already exists for " + request.getSemester() + ".");
                });

        User lecturer = resolveLecturer(request.getLecturerId());

        CourseOffering offering = CourseOffering.builder()
                .code(request.getCode().trim())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .semester(request.getSemester().trim())
                .credits(request.getCredits())
                .capacity(request.getCapacity())
                .lecturer(lecturer)
                .prerequisites(request.getPrerequisites())
                .status(request.getStatus() != null ? request.getStatus() : CourseOfferingStatus.DRAFT)
                .build();

        return toDTO(courseOfferingRepository.save(offering));
    }

    public CourseOfferingDTO update(Long id, CreateCourseOfferingRequest request) {
        CourseOffering offering = courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));

        boolean codeOrSemesterChanged =
                !offering.getCode().equals(request.getCode())
                        || !offering.getSemester().equals(request.getSemester());

        if (codeOrSemesterChanged) {
            courseOfferingRepository.findByCodeAndSemester(request.getCode(), request.getSemester())
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new BadRequestException(
                                "Another offering already uses this code for this semester.");
                    });
        }

        offering.setCode(request.getCode().trim());
        offering.setTitle(request.getTitle().trim());
        offering.setDescription(request.getDescription());
        offering.setSemester(request.getSemester().trim());
        offering.setCredits(request.getCredits());
        offering.setCapacity(request.getCapacity());
        offering.setLecturer(resolveLecturer(request.getLecturerId()));
        offering.setPrerequisites(request.getPrerequisites());
        if (request.getStatus() != null) {
            offering.setStatus(request.getStatus());
        }

        return toDTO(courseOfferingRepository.save(offering));
    }

    public CourseOfferingDTO updateStatus(Long id, CourseOfferingStatus status) {
        CourseOffering offering = courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));
        offering.setStatus(status);
        return toDTO(courseOfferingRepository.save(offering));
    }

    public void delete(Long id) {
        if (!courseOfferingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course offering " + id + " not found");
        }
        long enrolled = enrollmentRepository.countActiveByOfferingId(id);
        if (enrolled > 0) {
            throw new BadRequestException(
                    "Cannot delete an offering with active enrollments. Close it instead.");
        }
        courseOfferingRepository.deleteById(id);
    }

    public CourseOfferingDTO getById(Long id) {
        return toDTO(courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found")));
    }

    public List<CourseOfferingDTO> list(String semester, CourseOfferingStatus status) {
        List<CourseOffering> offerings;
        if (semester != null && status != null) {
            offerings = courseOfferingRepository.findBySemesterAndStatus(semester, status);
        } else if (semester != null) {
            offerings = courseOfferingRepository.findBySemester(semester);
        } else if (status != null) {
            offerings = courseOfferingRepository.findByStatus(status);
        } else {
            offerings = courseOfferingRepository.findAll();
        }
        return offerings.stream().map(this::toDTO).toList();
    }

    public List<CourseOfferingDTO> listByLecturer(Long lecturerId) {
        return courseOfferingRepository.findByLecturerId(lecturerId).stream()
                .map(this::toDTO).toList();
    }

    CourseOffering getEntityOrThrow(Long id) {
        return courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));
    }

    private User resolveLecturer(Long lecturerId) {
        if (lecturerId == null) return null;
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new UserNotFoundException(lecturerId));
        if (lecturer.getRole() != Role.LECTURER && lecturer.getRole() != Role.ADMIN) {
            throw new BadRequestException("Assigned user must be a LECTURER or ADMIN.");
        }
        return lecturer;
    }

    CourseOfferingDTO toDTO(CourseOffering offering) {
        int enrolled = (int) enrollmentRepository.countActiveByOfferingId(offering.getId());
        int capacity = offering.getCapacity() != null ? offering.getCapacity() : 0;
        return CourseOfferingDTO.builder()
                .id(offering.getId())
                .code(offering.getCode())
                .title(offering.getTitle())
                .description(offering.getDescription())
                .semester(offering.getSemester())
                .credits(offering.getCredits())
                .capacity(capacity)
                .enrolledCount(enrolled)
                .seatsAvailable(Math.max(0, capacity - enrolled))
                .lecturerId(offering.getLecturer() != null ? offering.getLecturer().getId() : null)
                .lecturerName(offering.getLecturer() != null ? offering.getLecturer().getName() : null)
                .prerequisites(offering.getPrerequisites())
                .status(offering.getStatus())
                .build();
    }
}
